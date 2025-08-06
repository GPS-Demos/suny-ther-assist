#!/usr/bin/env python3
"""
Script to rename files and folders in the RAG materials directory
to make them filesystem-friendly.
"""
import os
import re
from pathlib import Path

def clean_filename(filename):
    """Clean a filename to make it filesystem-friendly."""
    # Extract date patterns like (KP 03.24.2025) and convert to _KP_2025-03-24
    date_pattern = r'\(([A-Z]+)\s+(\d{2})\.(\d{2})\.(\d{4})\)'
    filename = re.sub(date_pattern, r'_\1_\4-\2-\3', filename)
    
    # Remove any remaining parentheses
    filename = filename.replace('(', '').replace(')', '')
    
    # Replace & with and
    filename = filename.replace('&', 'and')
    
    # Replace spaces with underscores
    filename = filename.replace(' ', '_')
    
    # Replace multiple underscores with single
    filename = re.sub(r'_+', '_', filename)
    
    # Remove trailing underscores before extension
    filename = re.sub(r'_+\.', '.', filename)
    
    # Clean up numbered prefixes (e.g., "1." becomes "1_")
    filename = re.sub(r'^(\d+)\.', r'\1_', filename)
    
    return filename

def get_all_paths(root_dir):
    """Get all file and directory paths, sorted by depth (deepest first)."""
    all_paths = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Add directories
        for dirname in dirnames:
            full_path = os.path.join(dirpath, dirname)
            all_paths.append((full_path, 'dir'))
        
        # Add files
        for filename in filenames:
            full_path = os.path.join(dirpath, filename)
            all_paths.append((full_path, 'file'))
    
    # Sort by depth (deepest first) to avoid breaking paths
    all_paths.sort(key=lambda x: x[0].count(os.sep), reverse=True)
    
    return all_paths

def rename_path(old_path, path_type):
    """Rename a single file or directory."""
    old_name = os.path.basename(old_path)
    new_name = clean_filename(old_name)
    
    if old_name == new_name:
        return old_path  # No change needed
    
    parent_dir = os.path.dirname(old_path)
    new_path = os.path.join(parent_dir, new_name)
    
    # Check if new path already exists
    if os.path.exists(new_path):
        print(f"Warning: {new_path} already exists, skipping rename of {old_path}")
        return old_path
    
    try:
        os.rename(old_path, new_path)
        print(f"Renamed: {old_name} -> {new_name}")
        return new_path
    except Exception as e:
        print(f"Error renaming {old_path}: {e}")
        return old_path

def main():
    """Main function to rename all files and directories."""
    root_dir = "../backend/rag/materials"
    
    if not os.path.exists(root_dir):
        print(f"Error: Directory {root_dir} does not exist!")
        return
    
    print(f"Starting to rename files in {root_dir}...")
    print("-" * 50)
    
    # Get all paths sorted by depth
    all_paths = get_all_paths(root_dir)
    
    # Rename each path
    renamed_count = 0
    for old_path, path_type in all_paths:
        new_path = rename_path(old_path, path_type)
        if old_path != new_path:
            renamed_count += 1
    
    print("-" * 50)
    print(f"Renaming complete! Renamed {renamed_count} items.")

if __name__ == "__main__":
    main()
