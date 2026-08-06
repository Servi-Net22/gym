/**
 * Liquidación operativa al estilo anexo "recibo de sueldo".
 * Porcentajes por defecto orientativos (AR); no constituye asesoramiento legal/contable.
 */

export type ReceiptLine = {
  concepto: string;
  unidad: string;
  base: number | null;
  monto: number;
  /** Clasificación para la barra de composición salarial */
  kind: "remunerativo" | "no_remunerativo" | "descuento" | "contribucion";
};

export type PayrollTotalsBreakdown = {
  sindical: { empleador: number; trabajador: number };
  seguridadSocial: { empleador: number; trabajador: number };
  obraSocial: { empleador: number; trabajador: number };
  inssjp: { empleador: number; trabajador: number };
  art: { empleador: number; trabajador: number };
  scvo: { empleador: number; trabajador: number };
};

export type BuiltPayroll = {
  sueldoBruto: number;
  sueldoNeto: number;
  employerLines: ReceiptLine[];
  employeeLines: ReceiptLine[];
  subtotalContribuciones: number;
  costoTotalEmpleador: number;
  composition: {
    remunerativo: number;
    noRemunerativo: number;
    descuentos: number;
  };
  breakdown: PayrollTotalsBreakdown;
};

/** Defaults configurables vía env (porcentajes sobre bruto). */
export function getPayrollDefaults() {
  const num = (key: string, fallback: number) => {
    const raw = process.env[key];
    if (raw == null || raw === "") return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    /** Empleado */
    jubilacionPct: num("PAYROLL_JUBILACION_PCT", 11),
    ley19032Pct: num("PAYROLL_LEY19032_PCT", 3),
    obraSocialPct: num("PAYROLL_OBRA_SOCIAL_PCT", 3),
    /** Empleador */
    artPct: num("PAYROLL_ART_PCT", 3),
    contribJubilacionPct: num("PAYROLL_CONTRIB_JUBILACION_PCT", 18),
    contribOoSsPct: num("PAYROLL_CONTRIB_OOSS_PCT", 6),
    seguroVidaFijo: num("PAYROLL_SEGURO_VIDA_FIJO", 0),
    costoCctFijo: num("PAYROLL_COSTO_CCT_FIJO", 0),
  };
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function yearsOfSeniority(hireDate: Date, asOf: Date) {
  let years = asOf.getFullYear() - hireDate.getFullYear();
  const m = asOf.getMonth() - hireDate.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < hireDate.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function quincenaLabel(quincena: number | null | undefined) {
  if (quincena === 1) return "1ª";
  if (quincena === 2) return "2ª";
  return "Mensual";
}

export function buildPayrollFromBruto(
  sueldoBruto: number,
  overrides?: Partial<ReturnType<typeof getPayrollDefaults>>,
): BuiltPayroll {
  const d = { ...getPayrollDefaults(), ...overrides };
  const bruto = roundMoney(sueldoBruto);

  const jub = roundMoney((bruto * d.jubilacionPct) / 100);
  const ley = roundMoney((bruto * d.ley19032Pct) / 100);
  const os = roundMoney((bruto * d.obraSocialPct) / 100);

  const art = roundMoney((bruto * d.artPct) / 100);
  const contribJub = roundMoney((bruto * d.contribJubilacionPct) / 100);
  const contribOs = roundMoney((bruto * d.contribOoSsPct) / 100);
  const scvo = roundMoney(d.seguroVidaFijo);
  const cct = roundMoney(d.costoCctFijo);

  const employerLines: ReceiptLine[] = [
    {
      concepto: "ART",
      unidad: `${d.artPct}%`,
      base: bruto,
      monto: art,
      kind: "contribucion",
    },
    {
      concepto: "Contribución Jubilación",
      unidad: `${d.contribJubilacionPct}%`,
      base: bruto,
      monto: contribJub,
      kind: "contribucion",
    },
    {
      concepto: "Contribución OO.SS.",
      unidad: `${d.contribOoSsPct}%`,
      base: bruto,
      monto: contribOs,
      kind: "contribucion",
    },
  ];
  if (scvo > 0) {
    employerLines.push({
      concepto: "Seguro de vida",
      unidad: "fijo",
      base: null,
      monto: scvo,
      kind: "contribucion",
    });
  }
  if (cct > 0) {
    employerLines.push({
      concepto: "Costo derivado del CCT",
      unidad: "fijo",
      base: null,
      monto: cct,
      kind: "contribucion",
    });
  }

  const employeeLines: ReceiptLine[] = [
    {
      concepto: "Sueldo Básico",
      unidad: "30",
      base: bruto,
      monto: bruto,
      kind: "remunerativo",
    },
    {
      concepto: "Aporte Jubilación",
      unidad: `${d.jubilacionPct}%`,
      base: bruto,
      monto: jub,
      kind: "descuento",
    },
    {
      concepto: "Ley 19.032 (INSSJP)",
      unidad: `${d.ley19032Pct}%`,
      base: bruto,
      monto: ley,
      kind: "descuento",
    },
    {
      concepto: "Obra Social",
      unidad: `${d.obraSocialPct}%`,
      base: bruto,
      monto: os,
      kind: "descuento",
    },
  ];

  const descuentos = roundMoney(jub + ley + os);
  const sueldoNeto = roundMoney(bruto - descuentos);
  const subtotalContribuciones = roundMoney(
    employerLines.reduce((s, l) => s + l.monto, 0),
  );
  const costoTotalEmpleador = roundMoney(bruto + subtotalContribuciones);

  return {
    sueldoBruto: bruto,
    sueldoNeto,
    employerLines,
    employeeLines,
    subtotalContribuciones,
    costoTotalEmpleador,
    composition: {
      remunerativo: bruto,
      noRemunerativo: 0,
      descuentos,
    },
    breakdown: {
      sindical: { empleador: 0, trabajador: 0 },
      seguridadSocial: { empleador: contribJub, trabajador: jub },
      obraSocial: { empleador: contribOs, trabajador: os },
      inssjp: { empleador: 0, trabajador: ley },
      art: { empleador: art, trabajador: 0 },
      scvo: { empleador: scvo, trabajador: 0 },
    },
  };
}

export function parseReceiptLines(value: unknown): ReceiptLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row): ReceiptLine | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const concepto = String(r.concepto ?? "");
      const unidad = String(r.unidad ?? "");
      const monto = Number(r.monto);
      if (!concepto || !Number.isFinite(monto)) return null;
      const baseRaw = r.base;
      const base =
        baseRaw == null || baseRaw === ""
          ? null
          : Number.isFinite(Number(baseRaw))
            ? Number(baseRaw)
            : null;
      const kindRaw = String(r.kind ?? "contribucion");
      const kind =
        kindRaw === "remunerativo" ||
        kindRaw === "no_remunerativo" ||
        kindRaw === "descuento" ||
        kindRaw === "contribucion"
          ? kindRaw
          : "contribucion";
      return { concepto, unidad, base, monto, kind };
    })
    .filter((x): x is ReceiptLine => x != null);
}

/** Reconstruye totales a partir de líneas persistidas (o recalcula desde bruto). */
export function resolvePayrollSnapshot(input: {
  sueldoBruto: number;
  amount: number;
  employerLines?: unknown;
  employeeLines?: unknown;
}): BuiltPayroll {
  const employerLines = parseReceiptLines(input.employerLines);
  const employeeLines = parseReceiptLines(input.employeeLines);

  if (employerLines.length === 0 && employeeLines.length === 0) {
    return buildPayrollFromBruto(input.sueldoBruto || input.amount);
  }

  const computed = buildPayrollFromBruto(input.sueldoBruto || input.amount);
  const subtotalContribuciones = roundMoney(
    employerLines.reduce((s, l) => s + l.monto, 0),
  );
  const descuentos = roundMoney(
    employeeLines
      .filter((l) => l.kind === "descuento")
      .reduce((s, l) => s + l.monto, 0),
  );
  const remunerativo = roundMoney(
    employeeLines
      .filter((l) => l.kind === "remunerativo")
      .reduce((s, l) => s + l.monto, 0) || input.sueldoBruto,
  );
  const noRemunerativo = roundMoney(
    employeeLines
      .filter((l) => l.kind === "no_remunerativo")
      .reduce((s, l) => s + l.monto, 0),
  );

  const findEmp = (re: RegExp) =>
    employerLines.find((l) => re.test(l.concepto))?.monto ?? 0;
  const findTrab = (re: RegExp) =>
    employeeLines.find((l) => re.test(l.concepto))?.monto ?? 0;

  return {
    sueldoBruto: input.sueldoBruto,
    sueldoNeto: input.amount,
    employerLines: employerLines.length ? employerLines : computed.employerLines,
    employeeLines: employeeLines.length ? employeeLines : computed.employeeLines,
    subtotalContribuciones,
    costoTotalEmpleador: roundMoney(input.sueldoBruto + subtotalContribuciones),
    composition: { remunerativo, noRemunerativo, descuentos },
    breakdown: {
      sindical: { empleador: 0, trabajador: findTrab(/sindical/i) },
      seguridadSocial: {
        empleador: findEmp(/jubilaci/i),
        trabajador: findTrab(/jubilaci/i),
      },
      obraSocial: {
        empleador: findEmp(/oo\.?\s*ss|obra social/i),
        trabajador: findTrab(/obra social/i),
      },
      inssjp: {
        empleador: 0,
        trabajador: findTrab(/19\.?032|inssjp/i),
      },
      art: { empleador: findEmp(/^art/i), trabajador: 0 },
      scvo: {
        empleador: findEmp(/seguro de vida|scvo/i),
        trabajador: 0,
      },
    },
  };
}

export type PieSlice = { label: string; value: number; color: string };

const PIE_COLORS = [
  "#2f4f4f",
  "#4a7c59",
  "#6b8e23",
  "#8b7355",
  "#5f6d63",
  "#3d5a5b",
  "#7a6c5d",
  "#556b2f",
];

export function employerCostPieSlices(payroll: BuiltPayroll): PieSlice[] {
  const slices: PieSlice[] = [
    { label: "Sueldo bruto", value: payroll.sueldoBruto, color: PIE_COLORS[0] },
    ...payroll.employerLines.map((l, i) => ({
      label: l.concepto,
      value: l.monto,
      color: PIE_COLORS[(i + 1) % PIE_COLORS.length],
    })),
  ].filter((s) => s.value > 0);

  return slices;
}

/** Paths SVG para un pie chart simple (viewBox 0 0 100 100). */
export function pieChartPaths(slices: PieSlice[]) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return [];

  let angle = -Math.PI / 2;
  const cx = 50;
  const cy = 50;
  const r = 45;

  return slices.map((slice) => {
    const portion = slice.value / total;
    const sweep = portion * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;

    // Casi 100%: círculo completo
    if (portion >= 0.999) {
      return {
        ...slice,
        d: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`,
        pct: portion * 100,
      };
    }

    return {
      ...slice,
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      pct: portion * 100,
    };
  });
}
