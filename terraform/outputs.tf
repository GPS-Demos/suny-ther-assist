output "therapy_analysis_function_url" {
  description = "URL of the therapy analysis Cloud Function"
  value       = "https://${var.region}-${var.project_id}.cloudfunctions.net/${google_cloudfunctions2_function.therapy_analysis.name}"
}

output "storage_access_function_url" {
  description = "URL of the storage access Cloud Function"
  value       = "https://${var.region}-${var.project_id}.cloudfunctions.net/${google_cloudfunctions2_function.storage_access.name}"
}

output "streaming_transcription_service_url" {
  description = "URL of the streaming transcription Cloud Run service"
  value       = "https://${google_cloud_run_v2_service.streaming_transcription.name}-${data.google_project.current.number}.${var.region}.run.app"
}

output "frontend_url" {
  description = "URL of the frontend Cloud Run service"
  value       = "https://${google_cloud_run_v2_service.frontend.name}-${data.google_project.current.number}.${var.region}.run.app"
}

output "websocket_url" {
  description = "WebSocket URL for streaming transcription"
  value       = "wss://${google_cloud_run_v2_service.streaming_transcription.name}-${data.google_project.current.number}.${var.region}.run.app/ws/transcribe"
}

output "deployment_summary" {
  description = "Summary of deployed services"
  value = {
    project_id             = var.project_id
    region                = var.region
    therapy_analysis_url   = "https://${var.region}-${var.project_id}.cloudfunctions.net/${google_cloudfunctions2_function.therapy_analysis.name}"
    storage_access_url     = "https://${var.region}-${var.project_id}.cloudfunctions.net/${google_cloudfunctions2_function.storage_access.name}"
    streaming_service_url  = "https://${google_cloud_run_v2_service.streaming_transcription.name}-${data.google_project.current.number}.${var.region}.run.app"
    frontend_url          = "https://${google_cloud_run_v2_service.frontend.name}-${data.google_project.current.number}.${var.region}.run.app"
    websocket_url         = "wss://${google_cloud_run_v2_service.streaming_transcription.name}-${data.google_project.current.number}.${var.region}.run.app/ws/transcribe"
  }
}
