"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskQueue = require("../src/index");
// This script outputs (roughly): Task 2, Task 1, Task 4, Task 3
(async () => {
    const queue = new TaskQueue({ size: 1 });
    await queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 1 ${new Date().toISOString()}`);
        resolve();
    }, 1000)));
    queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 2 ${new Date().toISOString()}`);
        resolve();
    }, 2000)));
    queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 3 ${new Date().toISOString()}`);
        resolve();
    }, 1000)));
    queue.push(() => new Promise((resolve) => setTimeout(() => {
        console.log(`Task 4 ${new Date().toISOString()}`);
        resolve();
    }, 5)));
    await queue.wait();
    console.log('stopped');
})();
