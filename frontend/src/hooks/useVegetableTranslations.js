import { useTranslation } from 'react-i18next';

export const useVegetableTranslations = () => {
  const { t, i18n } = useTranslation();

  const translateVegetable = (englishName) => {
    if (!englishName) return '';
    return t(`vegetables.${englishName}`, englishName);
  };

  const translateCategory = (category) => {
    if (!category) return '';
    return t(`categories.${category}`, category);
  };

  const getTranslatedVegetable = (vegetableObj) => {
    if (!vegetableObj) return '';
    if (typeof vegetableObj === 'string') {
      return translateVegetable(vegetableObj);
    }
    return translateVegetable(vegetableObj.name);
  };

  return {
    translateVegetable,
    translateCategory,
    getTranslatedVegetable,
    currentLanguage: i18n.language
  };
};

export default useVegetableTranslations;
