import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ({ items }: { items: { title: string; content: string }[] }) {
  return (
    <Accordion type="single" collapsible>
      {items.map((e, i) => {
        return (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{e.title}</AccordionTrigger>
            <AccordionContent>{e.content}</AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
