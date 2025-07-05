# ZAO AI Bot Render Deployment Guide

This guide will help you deploy the ZAO AI Bot with Discord and Farcaster integrations on Render.com.

## Prerequisites

- A Render.com account
- Your Discord bot token and application ID
- Farcaster API credentials (if using Farcaster integration)
- OpenAI API key

## Deployment Steps

### 1. Fork or Clone the Repository

Make sure you have the latest version of the code in your GitHub repository.

### 2. Sign in to Render

Go to [Render.com](https://render.com) and sign in with your account.

### 3. Create a New Service

1. Click on the "New +" button in the top right corner
2. Select "Background Worker" from the options

### 4. Connect Your Repository

1. Connect your GitHub account if not already connected
2. Select the repository containing your ZAO AI Bot code

### 5. Configure the Service

Use these settings:
- **Name**: zao-ai-bot (or your preferred name)
- **Docker Image**: Use the provided `render.Dockerfile`
- **Branch**: main (or your preferred branch)
- **Environment**: Docker

### 6. Set Environment Variables

Add the following environment variables:
- `DISCORD_API_TOKEN`: Your Discord bot token
- `DISCORD_APPLICATION_ID`: Your Discord application ID
- `FARCASTER_NEYNAR_API_KEY`: Your Farcaster API key
- `FARCASTER_SIGNER_UUID`: Your Farcaster signer UUID
- `FARCASTER_FID`: Your Farcaster FID
- `FARCASTER_DRY_RUN`: Set to "true" or "false" as needed
- `ENABLE_CAST`: Set to "true" or "false" as needed
- `CAST_INTERVAL_MIN`: Minimum interval between casts (in minutes)
- `CAST_INTERVAL_MAX`: Maximum interval between casts (in minutes)
- `ENABLE_ACTION_PROCESSING`: Set to "true" or "false" as needed
- `ACTION_INTERVAL`: Interval for action processing (in minutes)
- `DAEMON_PROCESS`: Set to "true" (required for headless operation)
- `OPENAI_API_KEY`: Your OpenAI API key

### 7. Deploy

Click "Create Background Worker" to start the deployment process.

## Monitoring and Logs

After deployment, you can monitor your bot's activity:

1. Go to your service dashboard on Render
2. Click on the "Logs" tab to view real-time logs
3. Use the "Shell" tab to access a terminal for debugging

## Troubleshooting

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure your Discord bot token is valid and has the necessary permissions
4. Check if your Farcaster API credentials are correct

## Automatic Deployment

The service is configured to automatically deploy when you push changes to your repository.

## Using Blueprint (render.yaml)

For easier deployment, you can use the provided `render.yaml` file:

1. Go to the Blueprint section in your Render dashboard
2. Select "New Blueprint Instance"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file and set up the service

---

For additional help, refer to the [Render documentation](https://render.com/docs) or contact support.
