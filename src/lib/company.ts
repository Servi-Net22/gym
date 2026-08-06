/** Datos de la empresa para el encabezado del recibo (env). */
export type CompanyInfo = {
  name: string;
  address: string;
  cuit: string;
  lugarPago: string;
  fPagoAportes: string;
};

export function getCompanyInfo(): CompanyInfo {
  return {
    name:
      process.env.COMPANY_NAME?.trim() ||
      process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
      "GymFlow",
    address: process.env.COMPANY_ADDRESS?.trim() || "—",
    cuit: process.env.COMPANY_CUIT?.trim() || "—",
    lugarPago:
      process.env.COMPANY_LUGAR_PAGO?.trim() ||
      process.env.COMPANY_ADDRESS?.trim() ||
      "—",
    fPagoAportes: process.env.COMPANY_F_PAGO_APORTES?.trim() || "",
  };
}
