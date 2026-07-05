/**
 * dev専用スタブ。
 * `cloudflare:workers` はWorkersランタイムにしか存在しないため、
 * vite dev（Node上で実行）ではこのスタブに解決される（vite.config.ts参照）。
 * `@cloudflare/workers-oauth-provider` は WorkerEntrypoint を
 * instanceof チェックにしか使わないので空クラスで足りる。
 */
export class WorkerEntrypoint {}
