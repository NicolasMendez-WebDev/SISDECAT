import { Router } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { organismos, dependencias, procesos, procedimientos, actividades } from '../../data/mockData';

const router = Router();

// Get all vigencias (Mocked for now)
router.get('/vigencias', async (req, res) => {
  try {
    // TODO: Uncomment when deploying to Azure with a real database
    // const vigencias = await (prisma as any).vigencia.findMany();
    // res.json(vigencias);
    
    // Using mock data for development
    res.json([{ id: '2026', nombre: 'Vigencia 2026' }]);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vigencias' });
  }
});

// Example route for Organismos using Mock Data
router.get('/organismos', async (req, res) => {
  try {
    // TODO: Uncomment when deploying to Azure
    // const data = await (prisma as any).organismo.findMany();
    // res.json(data);
    
    res.json(organismos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching organismos' });
  }
});

// Add more routes here for Org, Cat, Ops...

export default router;
