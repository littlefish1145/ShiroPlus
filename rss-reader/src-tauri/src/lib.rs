use serde::{Deserialize, Serialize};
use tauri::command;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum RssError {
    #[error("Failed to fetch RSS feed: {0}")]
    FetchError(String),
    #[error("Failed to parse RSS feed: {0}")]
    ParseError(String),
}

impl Serialize for RssError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedInfo {
    pub id: String,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Article {
    pub id: String,
    pub feed_id: String,
    pub title: String,
    pub link: String,
    pub description: Option<String>,
    pub content: Option<String>,
    pub pub_date: String,
    pub author: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseResult {
    pub feed: FeedInfo,
    pub articles: Vec<Article>,
}

fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap();
    format!("{:x}-{:x}", duration.as_secs(), duration.subsec_nanos())
}

fn strip_html(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut in_entity = false;
    let mut entity = String::new();
    
    for c in html.chars() {
        match c {
            '<' => in_tag = true,
            '>' => {
                in_tag = false;
                if !entity.is_empty() {
                    match entity.as_str() {
                        "amp" => result.push('&'),
                        "lt" => result.push('<'),
                        "gt" => result.push('>'),
                        "quot" => result.push('"'),
                        "apos" => result.push('\''),
                        "nbsp" => result.push(' '),
                        _ => {}
                    }
                    entity.clear();
                }
            }
            '&' if !in_tag => {
                in_entity = true;
                entity.clear();
            }
            ';' if in_entity => {
                in_entity = false;
                match entity.as_str() {
                    "amp" => result.push('&'),
                    "lt" => result.push('<'),
                    "gt" => result.push('>'),
                    "quot" => result.push('"'),
                    "apos" => result.push('\''),
                    "nbsp" => result.push(' '),
                    _ => {
                        if let Ok(n) = entity.parse::<u32>() {
                            if let Some(c) = char::from_u32(n) {
                                result.push(c);
                            }
                        }
                    }
                }
                entity.clear();
            }
            _ if in_entity => entity.push(c),
            _ if !in_tag => result.push(c),
            _ => {}
        }
    }
    result.trim().to_string()
}

#[tauri::command]
pub async fn parse_rss(url: String) -> Result<ParseResult, String> {
    let feed_id = generate_id();
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client
        .get(&url)
        .header("User-Agent", "RSS Reader/1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch: {}", e))?;
    
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    let parsed = feed_rs::parser::parse(body.as_bytes())
        .map_err(|e| format!("Failed to parse RSS: {}", e))?;
    
    let feed_info = FeedInfo {
        id: feed_id.clone(),
        title: parsed.title().map(|s| s.to_string()).unwrap_or_else(|| {
            url.clone()
        }),
        url: url.clone(),
        description: parsed.description().map(|s| s.to_string()),
        image_url: parsed.icon().map(|i| i.url.to_string()),
    };
    
    let articles: Vec<Article> = parsed
        .entries
        .iter()
        .map(|entry| {
            Article {
                id: generate_id(),
                feed_id: feed_id.clone(),
                title: entry.title().map(|s| s.to_string()).unwrap_or_else(|| "无标题".to_string()),
                link: entry.links.first().map(|l| l.href.to_string()).unwrap_or_default(),
                description: entry.summary().map(|s| strip_html(&s.to_string())),
                content: entry.content().map(|c| c.body.clone().unwrap_or_default()),
                pub_date: entry.updated.to_rfc3339(),
                author: entry.authors.first().map(|a| a.name.to_string()),
            }
        })
        .collect();
    
    Ok(ParseResult {
        feed: feed_info,
        articles,
    })
}
