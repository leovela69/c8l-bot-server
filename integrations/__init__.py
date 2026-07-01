# -*- coding: utf-8 -*-
"""
⚡ INTEGRATIONS — Conexiones externas de Antigravity v5.0
=========================================================
Módulos que permiten al bot interactuar con sistemas reales:
- GitHub: leer/escribir código, PRs, deploys
- Render: restart, logs, env vars
- Vercel: deploys web (futuro)
"""

from integrations.github_ops import GitHubOps, get_github
from integrations.deploy_control import DeployControl, get_deploy_control

__all__ = ["GitHubOps", "get_github", "DeployControl", "get_deploy_control"]
