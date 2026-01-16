import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import RegistrationForm from "./RegistrationForm";

const RegistrationModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-registration", onOpen as EventListener);
    return () => {
      window.removeEventListener("open-registration", onOpen as EventListener);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Join the Super Bowl Campaign</DialogTitle>
          <DialogDescription>Fill in your details to register for cashback.</DialogDescription>
        </DialogHeader>
        <RegistrationForm onSuccess={() => setOpen(false)} />
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;

