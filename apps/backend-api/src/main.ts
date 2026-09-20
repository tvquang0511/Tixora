import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);

	const config = new DocumentBuilder()
		.setTitle('Ticket Box API')
		.setDescription('Ticket Box backend API')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	// CORS configuration for Frontend, Admin, Mobile, and Preview domains
	const rawAllowedOrigins = [
		process.env.FRONTEND_URL,
		process.env.ADMIN_URL,
		...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()) : []),
		'http://localhost:3000',
		'http://localhost:3001',
		'http://localhost:3002',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:3001',
		'http://127.0.0.1:3002',
		'http://localhost:8081',
	].filter(Boolean) as string[];

	const allowedOrigins = new Set(rawAllowedOrigins.map((url) => url.replace(/\/+$/, '')));

	app.enableCors({
		origin: (
			origin: string | undefined,
			callback: (err: Error | null, allow?: boolean) => void,
		) => {
			// Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
			if (!origin) {
				return callback(null, true);
			}

			const normalizedOrigin = origin.replace(/\/+$/, '');
			if (allowedOrigins.has(normalizedOrigin)) {
				return callback(null, true);
			}

			try {
				const { hostname } = new URL(origin);
				// Allow Vercel preview deployments (*.vercel.app)
				if (hostname.endsWith('.vercel.app')) {
					return callback(null, true);
				}
			} catch {
				// Ignore malformed URL
			}

			callback(null, false);
		},
		credentials: true,
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Accept',
			'X-Requested-With',
			'Idempotency-Key',
			'x-upsert',
		],
		exposedHeaders: ['Content-Range', 'X-Total-Count', 'Idempotency-Key'],
	});

	const port = Number(process.env.PORT ?? 3000);
	await app.listen(port, '0.0.0.0');
}

bootstrap();
