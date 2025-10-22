variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region for deployments"
  type        = string
  default     = "us-central1"
}

variable "auth_allowed_domains" {
  description = "Comma-separated list of allowed domains for authentication"
  type        = string
  default     = "google.com"
}

variable "auth_allowed_emails" {
  description = "Comma-separated list of allowed emails for authentication"
  type        = string
}
