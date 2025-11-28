import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import seedData from '../data/seed_data.json';

const Seed = () => {
    const [status, setStatus] = useState('idle');
    const [log, setLog] = useState([]);

    const addLog = (msg) => setLog(prev => [...prev, msg]);

    const seedDatabase = async () => {
        setStatus('seeding');
        setLog([]);
        addLog('Starting seed process...');

        try {
            // 1. Seed Employees
            addLog(`Seeding ${seedData.employees.length} employees...`);
            const empBatch = writeBatch(db);
            seedData.employees.forEach(emp => {
                const ref = doc(db, 'employees', emp.id.toString());
                empBatch.set(ref, emp);
            });
            await empBatch.commit();
            addLog('Employees seeded successfully.');

            // 2. Seed Projects
            addLog(`Seeding ${seedData.projects.length} projects...`);
            // Firestore batches are limited to 500 ops. Split if necessary.
            const projectChunks = [];
            for (let i = 0; i < seedData.projects.length; i += 400) {
                projectChunks.push(seedData.projects.slice(i, i + 400));
            }

            for (const chunk of projectChunks) {
                const batch = writeBatch(db);
                chunk.forEach(proj => {
                    const ref = doc(db, 'projects', proj.id.toString());
                    batch.set(ref, proj);
                });
                await batch.commit();
            }
            addLog('Projects seeded successfully.');

            // 3. Seed Workload
            addLog(`Seeding ${seedData.workload.length} workload entries...`);
            const workloadChunks = [];
            for (let i = 0; i < seedData.workload.length; i += 400) {
                workloadChunks.push(seedData.workload.slice(i, i + 400));
            }

            for (const chunk of workloadChunks) {
                const batch = writeBatch(db);
                chunk.forEach(item => {
                    // Create a unique ID for workload entry
                    const id = `${item.empId}-${item.month}-${item.year}`;
                    const ref = doc(db, 'workload', id);
                    batch.set(ref, item);
                });
                await batch.commit();
            }
            addLog('Workload seeded successfully.');

            setStatus('success');
            addLog('Database seeding completed!');

        } catch (error) {
            console.error(error);
            setStatus('error');
            addLog(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <p className="text-yellow-800">
                    Warning: This will overwrite existing data in the Firestore database with data from
                    <code>src/data/seed_data.json</code>.
                </p>
            </div>

            <button
                onClick={seedDatabase}
                disabled={status === 'seeding'}
                className={`px-4 py-2 rounded text-white font-medium ${status === 'seeding' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {status === 'seeding' ? 'Seeding...' : 'Seed Database'}
            </button>

            <div className="mt-6 bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {log.map((msg, i) => (
                    <div key={i}>{msg}</div>
                ))}
                {log.length === 0 && <span className="text-slate-600">Ready to start...</span>}
            </div>
        </div>
    );
};

export default Seed;
