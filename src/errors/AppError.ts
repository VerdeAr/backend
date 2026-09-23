export interface ValidationErrorDetail {
	field: string;
	message: string;
}

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly errors?: ValidationErrorDetail[];

	constructor(
		message: string,
		statusCode = 400,
		errors?: ValidationErrorDetail[],
	) {
		super(message);
		this.statusCode = statusCode;
		this.errors = errors;
		Object.setPrototypeOf(this, AppError.prototype);
	}
}
