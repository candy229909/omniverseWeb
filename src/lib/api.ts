import { NextResponse } from 'next/server'
import { HttpError } from './auth'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status })
}

export function handleError(err: unknown) {
  if (err instanceof HttpError) return fail(err.status, err.message)
  console.error(err)
  const message = err instanceof Error ? err.message : '伺服器錯誤'
  return fail(500, message)
}
