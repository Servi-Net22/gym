import { createPlan } from "@/app/actions/plans";
import {
  CheckboxField,
  Field,
  FormGrid,
  PageHeader,
  Panel,
  SubmitButton,
  TextArea,
} from "@/components/Ui";

export default function NuevoPlanPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo plan"
        description="Definí nombre, precio y duración en días."
      />
      <Panel className="max-w-2xl">
        <form action={createPlan} className="space-y-5">
          <FormGrid>
            <Field label="Nombre" name="name" required placeholder="Mensual" />
            <Field
              label="Precio"
              name="price"
              type="number"
              required
              min="0"
              step="100"
            />
            <Field
              label="Duración (días)"
              name="durationDays"
              type="number"
              required
              min="1"
              defaultValue={30}
            />
          </FormGrid>
          <TextArea label="Descripción" name="description" />
          <CheckboxField label="Plan activo" name="active" />
          <SubmitButton>Guardar plan</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
