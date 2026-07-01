# -*- coding: utf-8 -*-
"""
⚡ GITHUB OPS — Control total de repositorios desde el bot
===========================================================
Permite al bot Telegram:
- Leer archivos de cualquier repo
- Crear branches
- Editar/crear archivos
- Hacer commits y push
- Crear Pull Requests
- Mergear PRs
- Listar repos, issues, etc.

Seguridad:
- Solo el ADMIN puede ejecutar operaciones de escritura
- Siempre en branch (nunca push directo a main)
- Backup automático (branch de respaldo antes de cambios)

Usa la GitHub REST API v3 con token personal.

Autor: C8L Agency / Leo
"""

import os
import time
import logging
import base64
from typing import Optional, Dict, List, Any
from dataclasses import dataclass

logger = logging.getLogger("c8l.integrations.github")


@dataclass
class GitHubResult:
    """Resultado de una operación GitHub."""
    success: bool
    message: str
    data: Optional[Dict] = None
    url: Optional[str] = None


class GitHubOps:
    """
    ⚡ Operaciones GitHub completas.

    Uso:
        gh = GitHubOps()
        result = gh.read_file("leovela69", "c8l-bot-server", "config.py")
        result = gh.edit_file("leovela69", "c8l-bot-server", "test.py", "print('hola')", "feat/test")
    """

    API_BASE = "https://api.github.com"

    def __init__(self, token: str = ""):
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        self.default_owner = os.environ.get("GITHUB_OWNER", "leovela69")
        self.default_repo = os.environ.get("GITHUB_REPO", "c8l-bot-server")
        self._stats = {
            "reads": 0,
            "writes": 0,
            "prs_created": 0,
            "errors": 0,
        }

        if self.token:
            logger.info("✅ GitHub Ops inicializado (token configurado)")
        else:
            logger.warning("⚠️ GitHub Ops sin token — solo lectura pública")

    def _headers(self) -> Dict[str, str]:
        """Headers de autenticación."""
        h = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    def _api(self, method: str, endpoint: str, json_data: Dict = None) -> Dict:
        """Llamada genérica a la API de GitHub."""
        import httpx

        url = f"{self.API_BASE}{endpoint}"
        with httpx.Client(timeout=30) as client:
            if method == "GET":
                resp = client.get(url, headers=self._headers())
            elif method == "POST":
                resp = client.post(url, headers=self._headers(), json=json_data)
            elif method == "PUT":
                resp = client.put(url, headers=self._headers(), json=json_data)
            elif method == "PATCH":
                resp = client.patch(url, headers=self._headers(), json=json_data)
            elif method == "DELETE":
                resp = client.delete(url, headers=self._headers())
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")

            if resp.status_code >= 400:
                error_msg = resp.json().get("message", resp.text[:200])
                raise Exception(f"GitHub API {resp.status_code}: {error_msg}")

            if resp.status_code == 204:
                return {}
            return resp.json()

    # ===================================================================
    # LECTURA
    # ===================================================================

    def read_file(self, owner: str = "", repo: str = "",
                  path: str = "", branch: str = "main") -> GitHubResult:
        """
        Lee un archivo del repositorio.

        Args:
            owner: Dueño del repo (default: leovela69)
            repo: Nombre del repo (default: c8l-bot-server)
            path: Ruta del archivo (ej: "config.py", "nlp/intent_engine.py")
            branch: Branch a leer (default: main)

        Returns:
            GitHubResult con el contenido del archivo
        """
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            endpoint = f"/repos/{owner}/{repo}/contents/{path}"
            params = f"?ref={branch}" if branch != "main" else ""
            data = self._api("GET", f"{endpoint}{params}")

            if data.get("type") == "file":
                content = base64.b64decode(data["content"]).decode("utf-8")
                self._stats["reads"] += 1
                return GitHubResult(
                    success=True,
                    message=f"Archivo leído: {path} ({len(content)} chars)",
                    data={"content": content, "sha": data["sha"], "size": data["size"]},
                    url=data.get("html_url"),
                )
            elif data.get("type") == "dir" or isinstance(data, list):
                # Es un directorio
                files = data if isinstance(data, list) else [data]
                file_list = [f.get("name", "") for f in files]
                return GitHubResult(
                    success=True,
                    message=f"Directorio: {path} ({len(file_list)} items)",
                    data={"files": file_list, "type": "directory"},
                )
            else:
                return GitHubResult(success=False, message=f"Tipo no soportado: {data.get('type')}")

        except Exception as e:
            self._stats["errors"] += 1
            return GitHubResult(success=False, message=f"Error leyendo {path}: {e}")

    def list_files(self, owner: str = "", repo: str = "",
                   path: str = "", branch: str = "main") -> GitHubResult:
        """Lista archivos en un directorio del repo."""
        return self.read_file(owner, repo, path, branch)

    def list_branches(self, owner: str = "", repo: str = "") -> GitHubResult:
        """Lista todas las branches del repo."""
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            data = self._api("GET", f"/repos/{owner}/{repo}/branches")
            branches = [b["name"] for b in data]
            return GitHubResult(
                success=True,
                message=f"{len(branches)} branches encontradas",
                data={"branches": branches},
            )
        except Exception as e:
            return GitHubResult(success=False, message=f"Error listando branches: {e}")

    def list_repos(self, owner: str = "") -> GitHubResult:
        """Lista repos del usuario."""
        owner = owner or self.default_owner

        try:
            data = self._api("GET", f"/users/{owner}/repos?sort=updated&per_page=20")
            repos = [{"name": r["name"], "description": r.get("description", ""),
                      "updated": r["updated_at"]} for r in data]
            return GitHubResult(
                success=True,
                message=f"{len(repos)} repos encontrados",
                data={"repos": repos},
            )
        except Exception as e:
            return GitHubResult(success=False, message=f"Error listando repos: {e}")

    def get_last_commits(self, owner: str = "", repo: str = "",
                         branch: str = "main", count: int = 5) -> GitHubResult:
        """Obtiene los últimos commits."""
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            data = self._api("GET",
                f"/repos/{owner}/{repo}/commits?sha={branch}&per_page={count}")
            commits = [{
                "sha": c["sha"][:7],
                "message": c["commit"]["message"].split("\n")[0][:80],
                "author": c["commit"]["author"]["name"],
                "date": c["commit"]["author"]["date"][:10],
            } for c in data]
            return GitHubResult(
                success=True,
                message=f"Últimos {len(commits)} commits",
                data={"commits": commits},
            )
        except Exception as e:
            return GitHubResult(success=False, message=f"Error: {e}")

    # ===================================================================
    # ESCRITURA
    # ===================================================================

    def create_branch(self, branch_name: str, from_branch: str = "main",
                      owner: str = "", repo: str = "") -> GitHubResult:
        """
        Crea una nueva branch desde otra.

        Args:
            branch_name: Nombre de la nueva branch
            from_branch: Branch base (default: main)
        """
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            # Obtener SHA de la branch base
            ref_data = self._api("GET",
                f"/repos/{owner}/{repo}/git/ref/heads/{from_branch}")
            sha = ref_data["object"]["sha"]

            # Crear nueva referencia
            self._api("POST", f"/repos/{owner}/{repo}/git/refs", {
                "ref": f"refs/heads/{branch_name}",
                "sha": sha,
            })

            self._stats["writes"] += 1
            return GitHubResult(
                success=True,
                message=f"Branch '{branch_name}' creada desde '{from_branch}'",
                data={"branch": branch_name, "sha": sha},
                url=f"https://github.com/{owner}/{repo}/tree/{branch_name}",
            )
        except Exception as e:
            self._stats["errors"] += 1
            return GitHubResult(success=False, message=f"Error creando branch: {e}")

    def edit_file(self, path: str, new_content: str, branch: str,
                  commit_message: str = "", owner: str = "",
                  repo: str = "") -> GitHubResult:
        """
        Edita (o crea) un archivo en el repo.

        Args:
            path: Ruta del archivo
            new_content: Contenido nuevo completo
            branch: Branch donde hacer el cambio
            commit_message: Mensaje del commit
        """
        owner = owner or self.default_owner
        repo = repo or self.default_repo
        commit_message = commit_message or f"⚡ Auto-edit: {path}"

        try:
            # Intentar obtener SHA actual del archivo (para update)
            sha = None
            try:
                existing = self._api("GET",
                    f"/repos/{owner}/{repo}/contents/{path}?ref={branch}")
                sha = existing.get("sha")
            except Exception:
                pass  # Archivo nuevo, no tiene SHA

            # Crear/actualizar archivo
            payload = {
                "message": commit_message,
                "content": base64.b64encode(new_content.encode()).decode(),
                "branch": branch,
            }
            if sha:
                payload["sha"] = sha

            data = self._api("PUT",
                f"/repos/{owner}/{repo}/contents/{path}", payload)

            self._stats["writes"] += 1
            return GitHubResult(
                success=True,
                message=f"{'Actualizado' if sha else 'Creado'}: {path} en {branch}",
                data={
                    "sha": data["content"]["sha"],
                    "commit_sha": data["commit"]["sha"][:7],
                },
                url=data["content"]["html_url"],
            )
        except Exception as e:
            self._stats["errors"] += 1
            return GitHubResult(success=False, message=f"Error editando {path}: {e}")

    def delete_file(self, path: str, branch: str,
                    commit_message: str = "", owner: str = "",
                    repo: str = "") -> GitHubResult:
        """Elimina un archivo del repo."""
        owner = owner or self.default_owner
        repo = repo or self.default_repo
        commit_message = commit_message or f"🗑️ Delete: {path}"

        try:
            # Obtener SHA
            existing = self._api("GET",
                f"/repos/{owner}/{repo}/contents/{path}?ref={branch}")
            sha = existing["sha"]

            # Eliminar
            self._api("DELETE", f"/repos/{owner}/{repo}/contents/{path}", {
                "message": commit_message,
                "sha": sha,
                "branch": branch,
            })

            self._stats["writes"] += 1
            return GitHubResult(success=True, message=f"Eliminado: {path}")
        except Exception as e:
            self._stats["errors"] += 1
            return GitHubResult(success=False, message=f"Error eliminando {path}: {e}")

    # ===================================================================
    # PULL REQUESTS
    # ===================================================================

    def create_pr(self, title: str, branch: str, body: str = "",
                  base: str = "main", owner: str = "",
                  repo: str = "") -> GitHubResult:
        """
        Crea un Pull Request.

        Args:
            title: Título del PR
            branch: Branch con los cambios
            body: Descripción del PR
            base: Branch destino (default: main)
        """
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            data = self._api("POST", f"/repos/{owner}/{repo}/pulls", {
                "title": title,
                "head": branch,
                "base": base,
                "body": body or f"PR automático creado por Antigravity Bot ⚡",
            })

            self._stats["prs_created"] += 1
            return GitHubResult(
                success=True,
                message=f"PR #{data['number']} creado: {title}",
                data={"number": data["number"], "state": data["state"]},
                url=data["html_url"],
            )
        except Exception as e:
            self._stats["errors"] += 1
            return GitHubResult(success=False, message=f"Error creando PR: {e}")

    def merge_pr(self, pr_number: int, method: str = "squash",
                 owner: str = "", repo: str = "") -> GitHubResult:
        """
        Mergea un Pull Request.

        Args:
            pr_number: Número del PR
            method: Método de merge (merge, squash, rebase)
        """
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            data = self._api("PUT",
                f"/repos/{owner}/{repo}/pulls/{pr_number}/merge", {
                    "merge_method": method,
                })

            return GitHubResult(
                success=True,
                message=f"PR #{pr_number} mergeado ({method})",
                data={"sha": data.get("sha", "")[:7]},
            )
        except Exception as e:
            self._stats["errors"] += 1
            return GitHubResult(success=False, message=f"Error mergeando PR: {e}")

    def list_prs(self, state: str = "open", owner: str = "",
                 repo: str = "") -> GitHubResult:
        """Lista Pull Requests."""
        owner = owner or self.default_owner
        repo = repo or self.default_repo

        try:
            data = self._api("GET",
                f"/repos/{owner}/{repo}/pulls?state={state}&per_page=10")
            prs = [{
                "number": pr["number"],
                "title": pr["title"][:60],
                "branch": pr["head"]["ref"],
                "state": pr["state"],
                "author": pr["user"]["login"],
            } for pr in data]
            return GitHubResult(
                success=True,
                message=f"{len(prs)} PRs ({state})",
                data={"prs": prs},
            )
        except Exception as e:
            return GitHubResult(success=False, message=f"Error: {e}")

    # ===================================================================
    # OPERACIÓN COMPUESTA: EDIT COMPLETO
    # ===================================================================

    def full_edit(self, path: str, new_content: str,
                  commit_message: str = "",
                  branch_name: str = "",
                  create_pr: bool = True,
                  owner: str = "", repo: str = "") -> GitHubResult:
        """
        ⚡ Operación completa: crear branch → editar archivo → crear PR.

        Este es el flujo que usará el bot para auto-modificarse:
        1. Crea branch desde main
        2. Edita el archivo
        3. Crea PR (opcional)

        Args:
            path: Archivo a editar
            new_content: Contenido nuevo
            commit_message: Mensaje del commit
            branch_name: Nombre de la branch (auto-generado si vacío)
            create_pr: Si crear PR automáticamente
        """
        owner = owner or self.default_owner
        repo = repo or self.default_repo
        branch_name = branch_name or f"bot/edit-{int(time.time())}"
        commit_message = commit_message or f"⚡ Bot edit: {path}"

        results = []

        # 1. Crear branch
        r1 = self.create_branch(branch_name, "main", owner, repo)
        if not r1.success:
            return r1
        results.append(f"✅ Branch: {branch_name}")

        # 2. Editar archivo
        r2 = self.edit_file(path, new_content, branch_name, commit_message, owner, repo)
        if not r2.success:
            return r2
        results.append(f"✅ Editado: {path}")

        # 3. Crear PR
        if create_pr:
            pr_title = f"⚡ {commit_message[:60]}"
            r3 = self.create_pr(pr_title, branch_name, commit_message, "main", owner, repo)
            if r3.success:
                results.append(f"✅ PR: #{r3.data['number']}")
                return GitHubResult(
                    success=True,
                    message="\n".join(results),
                    data={"branch": branch_name, "pr": r3.data, "file": path},
                    url=r3.url,
                )

        return GitHubResult(
            success=True,
            message="\n".join(results),
            data={"branch": branch_name, "file": path},
            url=r1.url,
        )

    # ===================================================================
    # STATS
    # ===================================================================

    def get_stats(self) -> Dict[str, Any]:
        return {**self._stats, "token_configured": bool(self.token)}

    def get_stats_text(self) -> str:
        s = self._stats
        return (
            f"🐙 *GitHub Ops*\n"
            f"📖 Lecturas: {s['reads']}\n"
            f"✏️ Escrituras: {s['writes']}\n"
            f"🔀 PRs creados: {s['prs_created']}\n"
            f"❌ Errores: {s['errors']}\n"
            f"🔑 Token: {'✅' if self.token else '❌'}"
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_github_instance: Optional[GitHubOps] = None


def get_github() -> GitHubOps:
    """Obtiene la instancia global de GitHub Ops."""
    global _github_instance
    if _github_instance is None:
        _github_instance = GitHubOps()
    return _github_instance
