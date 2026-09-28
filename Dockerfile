# syntax=docker/dockerfile:1
#
# heolleo 容器化构建/运行环境
#
# 为什么这样设计（针对 TTFHW 运行时长超时问题）：
#   1. 明确以 openEuler 24.03 LTS 作为运行基座（与目标系统对齐，避免环境差异）。
#   2. 构建阶段跳过 Electron 二进制下载（npm ci 触发的大文件下载是超时主因之一），
#      前端静态资源构建（vite build）并不依赖 Electron 二进制。
#   3. 通过 ARG 支持国内 npm 镜像源，避免依赖下载卡顿导致的超时。
#   4. 运行阶段用 nginx 服务化托管构建产物，提供可被健康检查探活的 HTTP 服务，
#      而不是启动需要图形界面的 Electron 进程（无显示环境下会挂起导致超时）。
#
# 基础镜像可通过 --build-arg BASE_IMAGE=... 覆盖，
# 便于在内网/离线环境替换为本地 load 的 openEuler 镜像 tar 包。

ARG BASE_IMAGE=openeuler/openeuler:24.03-lts

# ---------------------------------------------------------------------------
# 构建阶段：编译前端，产出静态资源 dist/
# ---------------------------------------------------------------------------
FROM ${BASE_IMAGE} AS build

# 国内镜像源（可通过 --build-arg 覆盖）
ARG NPM_REGISTRY=https://registry.npmmirror.com
ARG ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY} \
    ELECTRON_MIRROR=${ELECTRON_MIRROR} \
    # 仅构建前端静态资源，无需下载 Electron 二进制，显著缩短构建时长
    ELECTRON_SKIP_BINARY_DOWNLOAD=1

# openEuler 24.03 LTS 默认源中的 nodejs 为 20.x，满足 Vite 6 / Electron 28 的 >=18 要求；
# nodejs 包自带 npm。
RUN dnf install -y --nogpgcheck nodejs \
    && dnf clean all \
    && node -v \
    && npm -v

WORKDIR /opt/heolleo

# 先复制依赖清单与本地私有依赖包（lib/*.tgz 为 file: 依赖），充分利用镜像层缓存
COPY package.json package-lock.json ./
COPY lib ./lib
RUN npm ci --no-audit --no-fund

# 复制源码与构建配置后执行构建
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---------------------------------------------------------------------------
# 运行阶段：nginx 静态服务（可作为 TTFHW 的探活/运行目标）
# ---------------------------------------------------------------------------
FROM ${BASE_IMAGE} AS runtime

RUN dnf install -y --nogpgcheck nginx curl \
    && dnf clean all

COPY --from=build /opt/heolleo/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]