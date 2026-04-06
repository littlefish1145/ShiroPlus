import { apiClient } from '~/lib/request'
import { queryClient } from '~/providers/root/react-query-provider'
import { setIsOwnerLogged } from './hooks/owner'

export const login = async (username: string, password: string) => {
  const res: any = await apiClient.proxy.master.login.post({
    data: {
      username,
      password,
    },
  })
  if (res.token) {
    setIsOwnerLogged(true)
    queryClient.invalidateQueries({ queryKey: ['session'] })
  }
  return res
}
