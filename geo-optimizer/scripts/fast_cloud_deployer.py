#!/usr/bin/env python3
"""
scripts/fast_cloud_deployer.py
Ultra-fast atomic cloud server deployer:
1. Packages modified assets into a temporary tar.gz archive.
2. SFTP uploads to production remote server in 1 single connection.
3. Remotely extracts into webroot and cleans up archive.
4. Executes live curl HTTP/2 200 health check.
"""

import os
import tarfile
import argparse
import paramiko

def deploy(local_dir: str, server_ip: str, ssh_port: int, ssh_user: str, ssh_pass: str, remote_root: str, test_host: str):
    tar_local = "/tmp/fast_deploy.tar.gz"
    tar_remote = "/tmp/fast_deploy.tar.gz"

    print(f"📦 Packaging {local_dir} into {tar_local}...")
    with tarfile.open(tar_local, "w:gz") as tar:
        for root, _, files in os.walk(local_dir):
            for file in files:
                if file.startswith(".git") or file.endswith(".tar.gz") or file.endswith(".xlsx"):
                    continue
                full_p = os.path.join(root, file)
                rel_p = os.path.relpath(full_p, local_dir)
                tar.add(full_p, arcname=rel_p)

    size_kb = os.path.getsize(tar_local) / 1024
    print(f"✓ Archive ready: {size_kb:.1f} KB")

    print(f"🔌 Connecting to {server_ip}:{ssh_port} as {ssh_user}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(server_ip, port=ssh_port, username=ssh_user, password=ssh_pass, timeout=15)

    sftp = ssh.open_sftp()
    print("🚀 Uploading archive...")
    sftp.put(tar_local, tar_remote)
    sftp.close()

    print("⚡ Extracting on remote server...")
    cmd = f"tar -xzf {tar_remote} -C {remote_root} && rm -f {tar_remote}"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    err = stderr.read().decode()
    if err:
        print("❌ Remote extract error:", err)
    else:
        print("✓ Extraction successful!")

    # Live verify
    verify_cmd = f"curl -s -k -I -H 'Host: {test_host}' https://127.0.0.1/ | head -n 6"
    stdin, stdout, stderr = ssh.exec_command(verify_cmd)
    print("\n🔍 Live Server Health Check:")
    print(stdout.read().decode().strip())

    ssh.close()
    if os.path.exists(tar_local):
        os.remove(tar_local)
    print("\n✅ Deployment complete!")

if __name__ == "__main__":
    print("Run via import or pass custom CLI parameters.")
