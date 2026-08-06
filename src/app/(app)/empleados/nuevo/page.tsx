import { createEmployee } from "@/app/actions/employees";
import {
  CheckboxField,
  Field,
  FormGrid,
  PageHeader,
  Panel,
  SubmitButton,
  TextArea,
} from "@/components/Ui";

export default function NuevoEmpleadoPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Nuevo empleado"
        description="Completá la ficha y se crea el usuario de acceso al sistema."
      />
      <Panel className="max-w-3xl">
        <form action={createEmployee} className="space-y-5">
          <FormGrid>
            <Field label="Nombre" name="firstName" required />
            <Field label="Apellido" name="lastName" required />
            <Field label="Documento / DNI" name="documentId" required />
            <Field
              label="Cargo / rol"
              name="role"
              required
              placeholder="Entrenador, Recepción…"
            />
            <Field label="Teléfono" name="phone" />
            <Field
              label="Email de contacto / acceso"
              name="email"
              type="email"
              required
            />
            <Field
              label="Sueldo"
              name="salary"
              type="number"
              step="1000"
              min="0"
            />
            <Field
              label="Fecha de ingreso"
              name="hireDate"
              type="date"
              defaultValue={today}
            />
            <Field label="Dirección" name="address" />
            <Field
              label="Contraseña inicial de acceso"
              name="loginPassword"
              type="password"
              placeholder="empleado123"
            />
          </FormGrid>
          <TextArea label="Notas" name="notes" />
          <CheckboxField label="Empleado activo" name="active" />
          <p className="text-xs text-[var(--muted)]">
            El email se usa para iniciar sesión. Si no indicás contraseña, se
            asigna <code>empleado123</code>.
          </p>
          <SubmitButton>Guardar empleado</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
