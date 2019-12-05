import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { FeatureVisitReturnTypeMap } from "../../flavors/analyzer-flavor";
import { ComponentFeature } from "../../types/features/component-feature";

export type RefineFeatureEmitMap = { [K in ComponentFeature]: (result: FeatureVisitReturnTypeMap[K]) => void };

export function refineFeature<FeatureKind extends ComponentFeature, ValueType = FeatureVisitReturnTypeMap[FeatureKind]>(
	featureKind: FeatureKind,
	value: ValueType | ValueType[],
	context: AnalyzerVisitContext,
	emitMap: Partial<RefineFeatureEmitMap>
): void {
	/*if (Array.isArray(value)) {
		value.forEach(v => refineComponentFeature(featureKind, v, context, emitMap));
		return;
	}*/

	let refinedValue: undefined | typeof value = value;

	for (const flavor of context.flavors) {
		const refineFunc = flavor.refineFeature?.[featureKind];
		if (refineFunc != null) {
			if (refinedValue == null) {
				return;
			} else if (Array.isArray(refinedValue)) {
				const newValue: ValueType[] = [];
				for (const val of refinedValue) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const refined = refineFunc(val as any, context);
					if (refined != null) {
						newValue.push(...(((Array.isArray(refined) ? refined : [refined]) as unknown) as ValueType[]));
					}
				}
				refinedValue = newValue.length === 0 ? undefined : newValue;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				refinedValue = (refineFunc(refinedValue as any, context) as unknown) as typeof refinedValue;
			}
		}
	}

	if (refinedValue != null) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(Array.isArray(refinedValue) ? refinedValue : [refinedValue]).forEach(v => emitMap?.[featureKind]?.(v as any));
	}
}
