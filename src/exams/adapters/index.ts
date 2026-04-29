// @ts-nocheck
/**
 * Exam Adapters — aggregator.
 *
 * This file is imported once at server startup (via
 * loadBundledAdapters() in src/exam-builder/registry.ts). Each import
 * here triggers the adapter's side-effect registration.
 *
 * To add a new exam to the default bundle:
 *   import './my-new-exam';
 *
 * To add a new exam WITHOUT modifying this file (pure plugin mode):
 *   drop the file into this directory, then either
 *   (a) import it from your bootstrap code, OR
 *   (b) import it from this aggregator (preferred for production).
 *
 * Deployments that want different exam sets can fork this file or
 * bypass loadBundledAdapters() and register adapters directly from
 * their own bootstrap.
 */

import './bitsat-mathematics';
import './ugee-mathematics';
import './jee-main-mathematics';
import './neet-biology';
import './gate-mathematics';

// Future adapters go here:
// import './gate-cs';
// import './upsc-gs';
