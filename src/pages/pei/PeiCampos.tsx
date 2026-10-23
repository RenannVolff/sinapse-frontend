import { Calendar } from 'lucide-react';
import { Input, TextArea } from '../../components/ui/Input';
import { LIMITES } from '../../constants/limits';
import type { ErrosCampo } from '../../utils/validacao';
import { SECOES_PEI, type ValoresPei } from './peiValidacao';

interface PeiCamposProps {
  idPrefixo: string;
  valores: ValoresPei;
  onChange: (campo: keyof ValoresPei, valor: string) => void;
  errors: ErrosCampo;
  disabled?: boolean;
}

export function PeiCampos({ idPrefixo, valores, onChange, errors, disabled }: PeiCamposProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 relative z-10">
        {SECOES_PEI.map(({ campo, rotulo, placeholder }) => (
          <TextArea
            key={campo}
            id={`${idPrefixo}-${campo}`}
            name={campo}
            label={rotulo}
            value={valores[campo]}
            onChange={(e) => onChange(campo, e.target.value)}
            placeholder={disabled ? undefined : placeholder}
            maxLength={LIMITES.TEXTO_LONGO}
            showCounter={!disabled}
            error={errors[campo]}
            required
            disabled={disabled}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <Input
          label="Data de Início"
          name="dataInicio"
          type="date"
          value={valores.dataInicio}
          onChange={(e) => onChange('dataInicio', e.target.value)}
          icon={<Calendar className="h-5 w-5" />}
          min={LIMITES.DATA_MIN}
          max={LIMITES.DATA_MAX}
          error={errors.dataInicio}
          required
          disabled={disabled}
        />

        <Input
          label="Data de Fim (opcional)"
          name="dataFim"
          type="date"
          value={valores.dataFim}
          onChange={(e) => onChange('dataFim', e.target.value)}
          icon={<Calendar className="h-5 w-5" />}
          min={valores.dataInicio || LIMITES.DATA_MIN}
          max={LIMITES.DATA_MAX}
          error={errors.dataFim}
          disabled={disabled}
        />
      </div>
    </>
  );
}
