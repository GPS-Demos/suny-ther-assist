# cw-mentor

> **Note**: This is a fork of [gabbyburke/cw-mentor](https://github.com/gabbyburke/cw-mentor) maintained by GPS-Demos for demonstration purposes.

A child welfare case mentorship system with AI-powered analysis capabilities.

## Overview

This project provides tools for analyzing child welfare case interactions, offering feedback and guidance to social workers based on best practices and Arkansas child welfare guidelines.

## Project Structure

- **`frontend/`** - React-based web interface
- **`backend/`** - Google Cloud Functions for various services
  - `analysis-function/` - Main analysis service with Gemini integration
  - `mentorship-function/` - Mentorship services
  - `simulation-function/` - Simulation services
  - `rag/` - Retrieval-augmented generation components

## Features

- Real-time streaming analysis with thinking mode support
- Citation tracking and grounding metadata
- Interactive web interface for case analysis
- Support for supervisor and standard analysis displays

## Original Project

For the original project and its documentation, please visit: [gabbyburke/cw-mentor](https://github.com/gabbyburke/cw-mentor)
