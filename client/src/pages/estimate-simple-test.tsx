import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function EstimateSimpleTest() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    clientId: 1,
    projectId: 2,
    estimateNumber: `EST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 900) + 100}`,
    issueDate: new Date().toISOString(),
    subtotal: 1000,
    tax: 0,
    discount: 0,
    total: 1000,
    status: "pending",
    items: [
      {
        description: "Servicio de prueba",
        quantity: 1,
        unitPrice: 1000,
        amount: 1000
      }
    ]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'clientId' || name === 'projectId' || name === 'subtotal' || name === 'tax' || name === 'discount' || name === 'total' 
        ? Number(value) 
        : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('Enviando datos:', formData);
      
      const response = await apiRequest('POST', '/api/protected/estimates', formData);
      const data = await response.json();
      
      console.log('Respuesta:', data);
      setResult(data);
      
      toast({
        title: 'Estimado creado',
        description: `Estimado #${data.estimateNumber} creado exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al crear estimado:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el estimado',
        variant: 'destructive',
      });
      
      setResult({ error: error.message || 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Prueba Simple de Creación de Estimados</h1>
      <p className="text-red-500 mb-6">Esta es una página de prueba para diagnóstico.</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulario Simplificado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">ID del Cliente</Label>
                <Input 
                  id="clientId" 
                  name="clientId" 
                  type="number" 
                  value={formData.clientId} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="projectId">ID del Proyecto</Label>
                <Input 
                  id="projectId" 
                  name="projectId" 
                  type="number" 
                  value={formData.projectId} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="estimateNumber">Número de Estimado</Label>
              <Input 
                id="estimateNumber" 
                name="estimateNumber" 
                value={formData.estimateNumber} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal</Label>
                <Input 
                  id="subtotal" 
                  name="subtotal" 
                  type="number" 
                  value={formData.subtotal} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="total">Total</Label>
                <Input 
                  id="total" 
                  name="total" 
                  type="number" 
                  value={formData.total} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Estimado de Prueba'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}