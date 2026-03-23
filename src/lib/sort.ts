export type SortDirection = "asc" | "desc";

export function compareDateValues(
	leftDateValue: string,
	rightDateValue: string,
	direction: SortDirection,
) {
	const leftTimeMs = Date.parse(leftDateValue) || 0;
	const rightTimeMs = Date.parse(rightDateValue) || 0;
	return direction === "asc"
		? leftTimeMs - rightTimeMs
		: rightTimeMs - leftTimeMs;
}

export function sortRowsByDateValue<RowType>(
	rows: RowType[],
	getDateValue: (row: RowType) => string,
	direction: SortDirection,
): RowType[] {
	return [...rows].sort((leftRow, rightRow) => {
		return compareDateValues(
			getDateValue(leftRow),
			getDateValue(rightRow),
			direction,
		);
	});
}
