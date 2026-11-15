import { adaptAstronaut, adaptAstronautStatus, adaptHistoricalReading } from './adapters.ts'
import { ApiError, createApiClient, type ApiClientOptions } from './client.ts'
import { ContractError, decodeAstronauts, decodeAstronautStatus, decodeHealth, decodeReadings, isAstronautId } from './validators.ts'

export function createAstronautApi(options?: ApiClientOptions) {
  const client = createApiClient(options)

  return {
    getHealth(signal?: AbortSignal) {
      return client.get('/api/health', decodeHealth, { access: 'public', signal })
    },
    async listAstronauts(signal?: AbortSignal) {
      const astronauts = await client.get('/api/astronauts', decodeAstronauts, { access: 'protected', signal })
      return astronauts.map(adaptAstronaut)
    },
    async getAstronautReadings(id: string, signal?: AbortSignal) {
      if (!isAstronautId(id)) throw new ApiError('invalid-request')
      const readings = await client.get(`/api/astronauts/${encodeURIComponent(id)}/readings`, decodeReadings, {
        access: 'protected', signal,
      })
      if (readings.some((reading) => reading.astronaut_id !== id)) {
        throw new ContractError('astronaut identity in the reading history')
      }
      return readings.map(adaptHistoricalReading)
    },
    async getAstronautStatus(id: string, signal?: AbortSignal) {
      if (!isAstronautId(id)) throw new ApiError('invalid-request')
      const status = await client.get(`/api/astronauts/${encodeURIComponent(id)}/status`, decodeAstronautStatus, {
        access: 'protected', signal,
      })
      if (status.astronaut_id !== id) throw new ContractError('requested astronaut identity')
      return adaptAstronautStatus(status)
    },
  }
}
