// Bun loads text assets (imported with `with { type: "text" }`) as strings.
declare module "*/INDEX" {
	const content: string;
	export default content;
}
