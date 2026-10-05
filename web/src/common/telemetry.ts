import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

// Proxied by nginx to the local otel-collector (see docker-compose.yml and
// web/nginx). Same-origin, so no CORS configuration is needed.
const OTLP_TRACES_ENDPOINT = '/otel/v1/traces'

export function initTelemetry(): void {
  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'template-fastapi-react-web' }),
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: OTLP_TRACES_ENDPOINT }))],
  })
  provider.register()

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      // Default propagateTraceHeaderCorsUrls only covers the current origin,
      // which is exactly what we want — traceparent header is sent to /api/*.
      new FetchInstrumentation(),
    ],
  })
}
