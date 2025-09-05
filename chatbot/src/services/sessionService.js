const Redis = require('redis');
const logger = require('../utils/logger');

class SessionService {
  constructor() {
    this.redis = null;
    this.initializeRedis();
  }

  /**
   * Redis 초기화
   */
  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.redis.on('error', (err) => {
        logger.error('Redis 연결 오류:', err);
      });

      this.redis.on('connect', () => {
        logger.info('Redis 연결 성공');
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Redis 초기화 실패:', error);
      // Redis 연결 실패 시 메모리 기반 세션 사용
      this.memorySessions = new Map();
    }
  }

  /**
   * 사용자 세션 조회
   */
  async getUserSession(userId) {
    try {
      if (this.redis) {
        const sessionData = await this.redis.get(`session:${userId}`);
        return sessionData ? JSON.parse(sessionData) : this.createDefaultSession();
      } else {
        // 메모리 기반 세션
        return this.memorySessions.get(userId) || this.createDefaultSession();
      }
    } catch (error) {
      logger.error('세션 조회 실패:', error);
      return this.createDefaultSession();
    }
  }

  /**
   * 사용자 세션 업데이트
   */
  async updateUserSession(userId, sessionData) {
    try {
      const currentSession = await this.getUserSession(userId);
      const updatedSession = {
        ...currentSession,
        ...sessionData,
        updatedAt: new Date().toISOString()
      };

      if (this.redis) {
        await this.redis.setEx(
          `session:${userId}`,
          3600 * 24, // 24시간 TTL
          JSON.stringify(updatedSession)
        );
      } else {
        // 메모리 기반 세션
        this.memorySessions.set(userId, updatedSession);
      }

      // 사용자 로그 저장
      await this.saveUserLog(userId, 'session_update', sessionData);

      return updatedSession;
    } catch (error) {
      logger.error('세션 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 세션 삭제
   */
  async clearUserSession(userId) {
    try {
      if (this.redis) {
        await this.redis.del(`session:${userId}`);
      } else {
        this.memorySessions.delete(userId);
      }

      // 사용자 로그 저장
      await this.saveUserLog(userId, 'session_clear', {});

      logger.info(`사용자 세션 삭제: ${userId}`);
    } catch (error) {
      logger.error('세션 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 세션 생성
   */
  createDefaultSession() {
    return {
      userId: null,
      category: [],
      businessSummary: '',
      step: 'welcome', // welcome, category, business, result
      lastMessage: '',
      lastResponse: null,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 사용자 로그 저장
   */
  async saveUserLog(userId, action, data) {
    try {
      const logEntry = {
        userId,
        action,
        data,
        timestamp: new Date().toISOString()
      };

      if (this.redis) {
        await this.redis.lPush(
          `logs:${userId}`,
          JSON.stringify(logEntry)
        );
        // 로그는 최대 100개까지만 보관
        await this.redis.lTrim(`logs:${userId}`, 0, 99);
      } else {
        // 메모리 기반 로그
        if (!this.userLogs) {
          this.userLogs = new Map();
        }
        if (!this.userLogs.has(userId)) {
          this.userLogs.set(userId, []);
        }
        const logs = this.userLogs.get(userId);
        logs.unshift(logEntry);
        if (logs.length > 100) {
          logs.splice(100);
        }
      }
    } catch (error) {
      logger.error('로그 저장 실패:', error);
    }
  }

  /**
   * 사용자 로그 조회
   */
  async getUserLogs(userId, limit = 20) {
    try {
      if (this.redis) {
        const logs = await this.redis.lRange(`logs:${userId}`, 0, limit - 1);
        return logs.map(log => JSON.parse(log));
      } else {
        // 메모리 기반 로그
        const logs = this.userLogs?.get(userId) || [];
        return logs.slice(0, limit);
      }
    } catch (error) {
      logger.error('로그 조회 실패:', error);
      return [];
    }
  }

  /**
   * 세션 통계 조회
   */
  async getSessionStats() {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('session:*');
        return {
          totalSessions: keys.length,
          activeSessions: keys.length
        };
      } else {
        return {
          totalSessions: this.memorySessions?.size || 0,
          activeSessions: this.memorySessions?.size || 0
        };
      }
    } catch (error) {
      logger.error('세션 통계 조회 실패:', error);
      return { totalSessions: 0, activeSessions: 0 };
    }
  }

  /**
   * 만료된 세션 정리
   */
  async cleanupExpiredSessions() {
    try {
      if (this.redis) {
        // Redis는 TTL로 자동 정리됨
        logger.info('Redis TTL로 세션 자동 정리됨');
      } else {
        // 메모리 기반 세션 정리 (24시간 이상 된 세션)
        const now = new Date();
        const expiredUsers = [];

        for (const [userId, session] of this.memorySessions.entries()) {
          const sessionTime = new Date(session.updatedAt);
          const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            expiredUsers.push(userId);
          }
        }

        expiredUsers.forEach(userId => {
          this.memorySessions.delete(userId);
        });

        if (expiredUsers.length > 0) {
          logger.info(`${expiredUsers.length}개의 만료된 세션 정리됨`);
        }
      }
    } catch (error) {
      logger.error('세션 정리 실패:', error);
    }
  }
}

module.exports = new SessionService();
