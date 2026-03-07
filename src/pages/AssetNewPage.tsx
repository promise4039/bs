import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetFormSheet } from '../components/ui/AssetFormSheet';

export default function AssetNewPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    navigate('/assets');
  };

  return <AssetFormSheet isOpen={isOpen} onClose={handleClose} />;
}
