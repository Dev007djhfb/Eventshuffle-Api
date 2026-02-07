// ⚠️ This must be imported BEFORE any other imports
import './telemetry/telemetry';

// Now import the rest of the application
import { initializeTelemetry } from './core/telemetry/telemetry';

// Initialize telemetry before anything else
initializeTelemetry();
