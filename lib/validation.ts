import { NextRequest } from 'next/server'

const MAX_STRING_LENGTH = 500
const MAX_ARRAY_LENGTH = 100

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateGenerateRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const { topic } = body as Record<string, unknown>

  if (typeof topic !== 'string' || topic.trim().length === 0) {
    errors.push('topic is required and must be a non-empty string')
  } else if (topic.length > MAX_STRING_LENGTH) {
    errors.push(`topic must not exceed ${MAX_STRING_LENGTH} characters`)
  }

  return { valid: errors.length === 0, errors }
}

export function validateQuizRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const { nodeName, nodeDescription, nodeId } = body as Record<string, unknown>

  if (typeof nodeName !== 'string' || nodeName.trim().length === 0) {
    errors.push('nodeName is required and must be a non-empty string')
  } else if (nodeName.length > MAX_STRING_LENGTH) {
    errors.push(`nodeName must not exceed ${MAX_STRING_LENGTH} characters`)
  }

  if (nodeDescription !== undefined && nodeDescription !== null) {
    if (typeof nodeDescription !== 'string') {
      errors.push('nodeDescription must be a string')
    } else if (nodeDescription.length > MAX_STRING_LENGTH) {
      errors.push(`nodeDescription must not exceed ${MAX_STRING_LENGTH} characters`)
    }
  }

  if (nodeId !== undefined && nodeId !== null && typeof nodeId !== 'string') {
    errors.push('nodeId must be a string')
  }

  return { valid: errors.length === 0, errors }
}

export function validateEvaluateRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const { quiz, answers } = body as Record<string, unknown>

  if (!quiz || typeof quiz !== 'object') {
    errors.push('quiz is required and must be an object')
  }

  if (!Array.isArray(answers)) {
    errors.push('answers must be an array')
  } else if (answers.length > MAX_ARRAY_LENGTH) {
    errors.push(`answers must not exceed ${MAX_ARRAY_LENGTH} items`)
  } else {
    answers.forEach((answer, i) => {
      if (typeof answer !== 'string') {
        errors.push(`answers[${i}] must be a string`)
      }
    })
  }

  return { valid: errors.length === 0, errors }
}

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || 'unknown'
}