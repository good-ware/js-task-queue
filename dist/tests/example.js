"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskQueue = require("../src/index");
// This script outputs (roughly): Task 2, Task 1, Task 4, Task 3
(async () => {
    const queue = new TaskQueue({ size: 2 });
    await queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 1 ${Date.now()}`);
        resolve();
    }, 400)));
    await queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 2 ${Date.now()}`);
        resolve();
    }, 300)));
    await queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 3 ${Date.now()}`);
        resolve();
    }, 200)));
    const ret = await queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 4 ${Date.now()}`);
        resolve();
    }, 100)));
    await ret.promise;
})();
