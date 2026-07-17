import { Server } from 'socket.io';
import logger from './loggerService.js';

class SocketService {
    constructor() {
        this.io = null;
    }

    /**
     * Initialize Socket.io with the HTTP server
     */
    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*", // Adjust in production
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            const adminToken = socket.handshake.query.token;
            logger.info(`New client connected: ${socket.id}`);

            // Room for build logs
            socket.on('subscribe:build', (jobId) => {
                socket.join(`build:${jobId}`);
                logger.info(`Socket ${socket.id} subscribed to build logs: ${jobId}`);
            });

            // Room for system telemetry
            socket.on('subscribe:telemetry', () => {
                socket.join('telemetry');
                logger.info(`Socket ${socket.id} subscribed to system telemetry`);
            });

            // Room for system activity
            socket.on('subscribe:activity', () => {
                socket.join('activity');
                logger.info(`Socket ${socket.id} subscribed to system activity`);
            });

            // Room for reseller specific app builder real-time updates
            socket.on('subscribe:reseller_app', (resellerId) => {
                socket.join(`reseller_app:${resellerId}`);
                logger.info(`Socket ${socket.id} subscribed to app builder updates for reseller: ${resellerId}`);
            });

            // Room for reseller customers real-time updates (branding, pricing)
            socket.on('subscribe:reseller_customer', (resellerId) => {
                socket.join(`reseller_${resellerId}`);
                logger.info(`Socket ${socket.id} subscribed to customer updates for reseller: ${resellerId}`);
            });

            // Room for individual user updates (like wallet balance)
            socket.on('subscribe:user', (userId) => {
                socket.join(`user_${userId}`);
                logger.info(`Socket ${socket.id} subscribed to user updates: ${userId}`);
            });

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });

        logger.info("Real-time Socket Engine Initialized.");
        return this.io;
    }

    /**
     * Emit reseller app config sync event
     */
    emitResellerAppSync(resellerId, data) {
        if (this.io) {
            this.io.to(`reseller_app:${resellerId}`).emit('app:sync', { 
                timestamp: new Date(),
                ...data
            });
        }
    }

    /**
     * Emit reseller app build status change
     */
    emitAppBuildStatus(resellerId, statusData) {
        if (this.io) {
            this.io.to(`reseller_app:${resellerId}`).emit('app:build-status', { 
                timestamp: new Date(),
                ...statusData
            });
        }
    }

    /**
     * Emit build log to specific job room
     */
    emitBuildLog(jobId, log) {
        if (this.io) {
            this.io.to(`build:${jobId}`).emit('build:log', { jobId, log, timestamp: new Date() });
        }
    }

    /**
     * Emit global telemetry update
     */
    emitTelemetry(data) {
        if (this.io) {
            this.io.to('telemetry').emit('telemetry:update', data);
        }
    }

    /**
     * Emit real-time ecosystem activity event
     */
    emitActivity(event) {
        if (this.io) {
            this.io.to('activity').emit('activity:new', {
                ...event,
                timestamp: new Date()
            });
        }
    }

    /**
     * Emit build status update
     */
    emitBuildStatus(jobId, status, progressPct) {
        if (this.io) {
            this.io.to(`build:${jobId}`).emit('build:status', { jobId, status, progressPct });
        }
    }

    /**
     * Emit service status update standardly to all connected clients
     */
    emitServiceStatusUpdate(serviceStatus) {
        if (this.io) {
            this.io.emit('service-status:update', serviceStatus);
        }
    }

    /**
     * Emit maintenance status update standardly to all connected clients
     */
    emitMaintenanceUpdate(maintenanceData) {
        if (this.io) {
            this.io.emit('maintenance:update', maintenanceData);
        }
    }

    /**
     * Emit branding sync to a specific reseller's customers
     */
    emitBrandingSync(resellerId, branding) {
        if (this.io) {
            this.io.to(`reseller_${resellerId}`).emit('branding:sync', { 
                timestamp: new Date(),
                branding
            });
        }
    }

    /**
     * Emit pricing sync to a specific reseller's customers
     */
    emitPricingSync(resellerId) {
        if (this.io) {
            this.io.to(`reseller_${resellerId}`).emit('pricing:sync', { 
                timestamp: new Date()
            });
        }
    }
    /**
     * Emit wallet sync to a specific user
     */
    emitWalletSync(userId, balance) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit('wallet:sync', { 
                timestamp: new Date(),
                balance
            });
        }
    }

    /**
     * Emit wallet funded to a specific user
     */
    emitWalletFunded(userId, data) {
        if (this.io) {
            this.io.to(`user_${userId}`).emit('wallet:funded', { 
                timestamp: new Date(),
                ...data
            });
        }
    }
}

const socketService = new SocketService();
export default socketService;
