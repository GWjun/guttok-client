class APIError extends Error {
  statusCode: number
  errorCode: string

  constructor({
    message,
    statusCode,
    errorCode,
  }: {
    message: string
    statusCode: number
    errorCode: string
  }) {
    super(message)

    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

export default APIError
