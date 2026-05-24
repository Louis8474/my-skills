/**
 * 诊断工具 - 检查系统环境和配置
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { readFileSync } from 'fs';
import axios from 'axios';
import { config } from '../config';
import { createSafeLogger } from './logger';

const logger = createSafeLogger('Doctor');

export interface DoctorResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}

/**
 * 诊断检查项
 */
class Doctor {
  private results: DoctorResult[] = [];

  /**
   * 运行所有诊断检查
   */
  async run(): Promise<DoctorResult[]> {
    this.results = [];

    logger.log('🔍 开始系统诊断...\n');

    await this.checkNodeVersion();
    await this.checkProjectFiles();
    await this.checkDingtalkConfig();
    await this.checkOpenCode();
    await this.checkDependencies();

    this.printResults();
    return this.results;
  }

  /**
   * 检查 Node.js 版本
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async checkNodeVersion(): Promise<void> {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    const status = major >= 18 ? 'pass' : 'fail';

    this.results.push({
      name: 'Node.js 版本',
      status,
      message: status === 'pass' ? `✅ Node.js ${version}` : `❌ Node.js ${version} (需要 >= 18)`,
    });
  }

  /**
   * 检查项目文件
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async checkProjectFiles(): Promise<void> {
    const files = [
      { path: 'package.json', name: 'package.json' },
      { path: 'dist/index.js', name: '编译输出' },
      { path: '.env', name: '环境配置' },
    ];

    const issues: string[] = [];
    for (const file of files) {
      if (!existsSync(file.path)) {
        issues.push(`${file.name} 不存在`);
      }
    }

    // 检查 .env 权限
    if (existsSync('.env')) {
      const stats = statSync('.env');
      const mode = (stats.mode & 0o777).toString(8);
      if (mode !== '600') {
        issues.push('.env 权限应为 600，当前: ' + mode);
      }
    }

    this.results.push({
      name: '项目文件',
      status: issues.length === 0 ? 'pass' : 'fail',
      message: issues.length === 0 ? '✅ 所有必要文件存在' : '❌ ' + issues.join(', '),
    });
  }

  /**
   * 检查钉钉配置
   */
  private async checkDingtalkConfig(): Promise<void> {
    const issues: string[] = [];

    if (!config.dingtalk.appKey) {
      issues.push('DINGTALK_APP_KEY 未配置');
    }

    if (!config.dingtalk.appSecret) {
      issues.push('DINGTALK_APP_SECRET 未配置');
    }

    if (config.dingtalk.appSecret && config.dingtalk.appSecret.length < 10) {
      issues.push('DINGTALK_APP_SECRET 格式可能不正确');
    }

    // 检查 Token 有效性
    if (config.dingtalk.appKey && config.dingtalk.appSecret) {
      try {
        const response = await axios.get('https://oapi.dingtalk.com/gettoken', {
          params: {
            appkey: config.dingtalk.appKey,
            appsecret: config.dingtalk.appSecret,
          },
          timeout: 5000,
        });

        if (response.data?.access_token) {
          this.results.push({
            name: '钉钉 Token',
            status: 'pass',
            message: '✅ Token 获取成功',
            details: `Token 长度: ${response.data.access_token.length}`,
          });
        } else {
          issues.push('Token 响应格式异常');
        }
      } catch (error: any) {
        issues.push(`Token 获取失败: ${error.message}`);
      }
    }

    this.results.push({
      name: '钉钉配置',
      status: issues.length === 0 ? 'pass' : 'warn',
      message: issues.length === 0 ? '✅ 配置完整' : '⚠️ ' + issues.join(', '),
    });
  }

  /**
   * 检查 OpenCode
   */
  private async checkOpenCode(): Promise<void> {
    const cmd = config.ai.command;

    return new Promise(resolve => {
      const proc = spawn(cmd, ['--version'], {
        stdio: 'pipe',
        timeout: 5000,
      });

      let output = '';

      proc.stdout?.on('data', data => {
        output += data.toString();
      });

      proc.stderr?.on('data', data => {
        output += data.toString();
      });

      proc.on('close', code => {
        if (code === 0) {
          const version = output.trim().split('\n')[0] || 'unknown';
          this.results.push({
            name: 'OpenCode CLI',
            status: 'pass',
            message: `✅ 已安装 (${version.slice(0, 50)})`,
          });
        } else {
          this.results.push({
            name: 'OpenCode CLI',
            status: 'fail',
            message: '❌ 未安装或不可用',
            details: `命令: ${cmd}`,
          });
        }
        resolve();
      });

      proc.on('error', () => {
        this.results.push({
          name: 'OpenCode CLI',
          status: 'fail',
          message: '❌ 未安装或找不到命令',
          details: `命令: ${cmd}`,
        });
        resolve();
      });

      // 超时处理
      setTimeout(() => {
        proc.kill();
        this.results.push({
          name: 'OpenCode CLI',
          status: 'fail',
          message: '❌ 检查超时',
        });
        resolve();
      }, 5000);
    });
  }

  /**
   * 检查依赖
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async checkDependencies(): Promise<void> {
    const requiredDeps = ['dingtalk-stream', 'express', 'axios'];

    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const missing: string[] = [];

      for (const dep of requiredDeps) {
        if (!deps[dep]) {
          missing.push(dep);
        }
      }

      this.results.push({
        name: '依赖包',
        status: missing.length === 0 ? 'pass' : 'fail',
        message: missing.length === 0 ? '✅ 所有必要依赖已安装' : '❌ 缺少: ' + missing.join(', '),
      });
    } catch (_error) {
      this.results.push({
        name: '依赖包',
        status: 'warn',
        message: '⚠️ 无法检查 package.json',
      });
    }
  }

  /**
   * 打印诊断结果
   */
  private printResults(): void {
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warnCount = this.results.filter(r => r.status === 'warn').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;

    logger.log('═'.repeat(50));
    for (const result of this.results) {
      logger.log(result.message);
      if (result.details) {
        logger.log('   ' + result.details);
      }
    }
    logger.log('═'.repeat(50));
    logger.log(`\n📊 诊断结果: ✅ ${passCount} | ⚠️ ${warnCount} | ❌ ${failCount}`);

    if (failCount > 0) {
      logger.log('\n❌ 存在失败项，请修复后重试。\n');
    } else if (warnCount > 0) {
      logger.log('\n⚠️ 存在警告项，建议检查。\n');
    } else {
      logger.log('\n✅ 所有检查通过，系统可以正常启动！\n');
    }
  }
}

/**
 * 运行诊断
 */
export async function runDoctor(): Promise<DoctorResult[]> {
  const doctor = new Doctor();
  return doctor.run();
}
