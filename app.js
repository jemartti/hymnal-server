#!/usr/bin/env node

const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const json = require('koa-json');

const schedule = require('./data/schedule.json');
const localities = require('./data/localities.json');

const app = new Koa();
const router = new Router();

const secret = process.env.HYMNAL_API_SECRET;

app.use(logger());

// X-Response-Time response header
app.use(async(ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

app.use(json({ pretty: false, param: 'pretty' }));

// 401 Handling
app.use(function(ctx, next) {
    return next().catch((err) => {
        if (401 == err.status) {
            ctx.status = 401;
            ctx.body = 'Protected resource, use Authorization header to get access\n';
        } else {
            throw err;
        }
    });
});

// API Key request header validation
app.use(function(ctx, next) {
    if (!secret) {
        ctx.throw(500, 'Server error');
    }
    if (secret !== ctx.request.header.authorization) {
        ctx.throw(401, 'Invalid API Key');
    }

    return next();
});

router
    .get('/schedule', function(ctx, next) {
        ctx.body = {
            "schedule": schedule.schedule,
            "localities": localities
        };
    });

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT || 3000);

export default app;