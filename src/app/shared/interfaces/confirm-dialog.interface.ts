export interface IConfirmDialog {
    title: string;
    message: string;
    trueText: string;
    trueIcon?: string;
    trueColor?: "primary" | "accent" | "warn";
    falseText: string;
    falseIcon?: string;
    falseColor?: "primary" | "accent" | "warn";
}