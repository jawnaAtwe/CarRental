import { Select, SelectItem } from '@heroui/react';

type LanguageFilterProps = {
  language: string;
  languageFilter: string;
  setLanguageFilter: (lang: string) => void;
};

export const LanguageFilter = ({ language, languageFilter, setLanguageFilter }: LanguageFilterProps) => {
  const languageOptions = [
    { value: 'all', label: language === 'ar' ? 'الكل' : 'All' },
    { value: 'en', label: language === 'ar' ? 'الإنجليزية' : 'English' },
    { value: 'ar', label: language === 'ar' ? 'العربية' : 'Arabic' },
  ];

  return (
    <Select
      size="sm"
      label={language === 'ar' ? 'اللغة' : 'Language'}
      placeholder={language === 'ar' ? 'اختر اللغة' : 'Select Language'}
      selectedKeys={[languageFilter]}
      onChange={(e) => setLanguageFilter(e.target.value)}
      className="min-w-[180px]"
    >
      {languageOptions.map((option) => (
        <SelectItem key={option.value}>{option.label}</SelectItem>
      ))}
    </Select>
  );
};