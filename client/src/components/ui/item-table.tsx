import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

export interface ItemTableItem {
  id?: number;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
  notes?: string;
  type?: string;
}

interface ItemTableProps {
  items: ItemTableItem[];
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  emptyMessage?: string;
  className?: string;
}

export function ItemTable({
  items,
  subtotal,
  tax,
  discount,
  total,
  emptyMessage = "No hay artículos",
  className,
}: ItemTableProps) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[40%]">Descripción</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Precio Unitario</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-6 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.id || index} className="group hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    )}
                    {item.type && (
                      <Badge variant="outline" className="mt-1">
                        {item.type}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter className="bg-muted/20">
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Subtotal
            </TableCell>
            <TableCell className="text-right">{formatCurrency(subtotal)}</TableCell>
          </TableRow>
          {parseFloat(tax.toString()) > 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Impuestos
              </TableCell>
              <TableCell className="text-right">{formatCurrency(tax)}</TableCell>
            </TableRow>
          )}
          {parseFloat(discount.toString()) > 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Descuento
              </TableCell>
              <TableCell className="text-right">-{formatCurrency(discount)}</TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Total
            </TableCell>
            <TableCell className="text-right font-bold bg-primary/5">{formatCurrency(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}