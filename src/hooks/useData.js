import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const useData = () => {
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [workload, setWorkload] = useState([]);
    const [deployments, setDeployments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empSnap, projSnap, workSnap, depSnap] = await Promise.all([
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'workload')),
                getDocs(collection(db, 'deployments'))
            ]);

            setEmployees(empSnap.docs.map(doc => doc.data()));
            setProjects(projSnap.docs.map(doc => doc.data()));
            setWorkload(workSnap.docs.map(doc => doc.data()));
            setDeployments(depSnap.docs.map(doc => doc.data()));
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { employees, projects, workload, deployments, loading, error, refresh: fetchData };
};
