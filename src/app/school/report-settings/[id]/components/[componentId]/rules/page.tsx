import Link from "next/link";
import AddRuleForm from "./add-rule-form";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import {
  getReportComponent,
  getReportComponents,
  getReportComponentRules,
} from "@/lib/services/report-configuration.service";
import DeleteRuleButton from "./delete-rule-button";
import EditRuleForm from "./edit-rule-form";

interface RulesPageProps {
  params: Promise<{
    id: string;
    componentId: string;
  }>;
}

export default async function ComponentRulesPage({ params }: RulesPageProps) {
  const { id, componentId } = await params;

  const configurationId = Number(id);
  const parsedComponentId = Number(componentId);

  if (
    !Number.isInteger(configurationId) ||
    configurationId < 1 ||
    !Number.isInteger(parsedComponentId) ||
    parsedComponentId < 1
  ) {
    notFound();
  }

  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    notFound();
  }

  let component;

  try {
    component = await getReportComponent(schoolId, parsedComponentId);
  } catch {
    notFound();
  }

  if (
    component.configurationId !== configurationId ||
    component.type !== "CALCULATED"
  ) {
    notFound();
  }

  const [components, rules] = await Promise.all([
    getReportComponents(schoolId, configurationId),
    getReportComponentRules(schoolId, parsedComponentId),
  ]);

  const availableSources = components.filter(
    (item) =>
      item.id !== parsedComponentId &&
      item.type === "ASSESSMENT" &&
      !rules.some((rule) => rule.sourceComponentId === item.id),
  );

  const totalWeight = rules.reduce(
    (total, rule) => total + (rule.weight ?? 0),
    0,
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href={`/school/report-settings/${configurationId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to report configuration
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Calculation Rules
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Configure how this calculated component derives its score.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {component.name}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-700">
            Calculated Component
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {component.aggregationType}
          </span>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Total rule weight: <strong>{totalWeight.toFixed(2)}%</strong>
        </p>

        {Math.abs(totalWeight - 100) < 0.000001 && rules.length > 0 ? (
          <p className="mt-2 text-sm font-medium text-green-700">
            Rule weights total 100%.
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            Rule weights must total 100% before this component can be used for
            result calculation.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Existing Rules</h2>

        {rules.length === 0 ? (
          <p className="text-sm text-slate-500">
            No calculation rules have been added yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-3 pr-4 font-medium">Source Component</th>
                  <th className="py-3 text-right font-medium">Weight</th>
                  <th className="py-3 text-right text-sm font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rules.map((rule) => {
                  const source = components.find(
                    (item) => item.id === rule.sourceComponentId,
                  );

                  return (
                    <tr key={rule.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-slate-800">
                        {source?.name ?? `Component #${rule.sourceComponentId}`}
                      </td>

                      <td className="py-3 text-right font-medium text-slate-800">
                        {(rule.weight ?? 0).toFixed(2)}%
                      </td>

                      <td className="py-3">
                        <EditRuleForm
                          configurationId={configurationId}
                          componentId={parsedComponentId}
                          ruleId={rule.id}
                          currentWeight={rule.weight ?? 0}
                        />
                      </td>

                      <td className="py-3 text-right">
                        <DeleteRuleButton
                          configurationId={configurationId}
                          componentId={parsedComponentId}
                          ruleId={rule.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Add Calculation Rule
        </h2>

        {availableSources.length === 0 ? (
          <p className="text-sm text-slate-500">
            No eligible assessment components are available. Create an
            assessment component first, or check whether all available
            components have already been added.
          </p>
        ) : (
          <AddRuleForm
            configurationId={configurationId}
            componentId={parsedComponentId}
            availableSources={availableSources.map((source) => ({
              id: source.id,
              name: source.name,
            }))}
          />
        )}
      </section>
    </main>
  );
}
