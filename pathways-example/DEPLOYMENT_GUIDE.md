# Google Cloud Run Deployment Guide

This guide will help you deploy your Streamlit application to Google Cloud Run.

## Prerequisites

1. Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated
2. Make sure you're in the project directory: `/Users/williszhang/Projects/clinical-pathways-sample`

## Step 1: Set Required Permissions

Before deploying, ensure the following permissions are set:

### Cloud Build Service Account Permissions
The Cloud Build service account needs permission to deploy to Cloud Run. Run:

```bash
gcloud projects add-iam-policy-binding gen-sch \
  --member="serviceAccount:$(gcloud projects describe gen-sch --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding gen-sch \
  --member="serviceAccount:$(gcloud projects describe gen-sch --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Cloud Run Service Account Permissions
The Cloud Run service needs access to your GCS bucket. After deployment, grant access:

```bash
# First deploy, then get the service account email
SERVICE_ACCOUNT=$(gcloud run services describe sch_diagnosis_pathways_chatbot_2.1 \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant access to the GCS bucket
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectViewer gs://pathways_metadata
```

## Step 2: Deploy the Application

Run the following command to build and deploy your application:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

This command will:
1. Build your Docker image
2. Push it to Google Artifact Registry
3. Deploy it to Cloud Run with public access

## Step 3: Verify Deployment

After successful deployment, you'll see output similar to:
```
Service [sch_diagnosis_pathways_chatbot_2.1] revision [sch_diagnosis_pathways_chatbot_2.1-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://sch-diagnosis-pathways-chatbot-2-1-xxxxx-uc.a.run.app
```

## Step 4: Access Your Application

Visit the Service URL provided in the deployment output to access your public-facing Streamlit application.

## Troubleshooting

### Permission Issues
If you encounter permission errors during deployment:
1. Ensure you have the necessary roles in the project
2. Verify the Cloud Build service account has the required permissions

### Application Errors
If the application doesn't work after deployment:
1. Check Cloud Run logs: `gcloud run services logs read sch_diagnosis_pathways_chatbot_2.1 --region=us-central1`
2. Verify the GCS bucket permissions are correctly set
3. Ensure all environment variables and secrets are properly configured

### Memory Issues
If you encounter memory errors, you can increase the memory allocation by modifying the `--memory` parameter in `cloudbuild.yaml` (currently set to 2Gi).

## Additional Configuration

To modify deployment settings, edit the deployment step in `cloudbuild.yaml`:
- `--memory`: Adjust memory allocation (e.g., '4Gi' for 4GB)
- `--cpu`: Set CPU allocation (e.g., '2' for 2 vCPUs)
- `--max-instances`: Limit maximum instances for cost control
- `--min-instances`: Set minimum instances to reduce cold starts
