import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  SegmentedButtons,
  Menu,
  Divider,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCatalog } from '../../types';

const unitSchema = z.enum(['m²', 'mb', 't']);
const materialSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  unit: unitSchema,
  pricePerUnit: z.coerce.number().min(0.01, 'Cena musi być większa od 0'),
  density: z.coerce.number().min(0, 'Gęstość nie może być ujemna').optional(),
  category: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  initialData?: Partial<MaterialCatalog>;
  onSubmit: (data: Omit<MaterialCatalog, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  unitOptions?: string[];
}

export default function MaterialForm({
  initialData,
  onSubmit,
  onCancel,
  unitOptions = ['m²', 'mb', 't'],
}: MaterialFormProps) {
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: initialData?.name || '',
      unit: initialData?.unit as any || unitOptions[0],
      pricePerUnit: initialData?.pricePerUnit || 0,
      density: initialData?.density || undefined,
      category: initialData?.category || '',
    },
  });

  const selectedUnit = watch('unit');
  const isTonUnit = selectedUnit === 't';

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        unit: initialData.unit as any || unitOptions[0],
        pricePerUnit: initialData.pricePerUnit || 0,
        density: initialData.density || undefined,
        category: initialData.category || '',
      });
    }
  }, [initialData, reset, unitOptions]);

  const onSubmitForm = (data: MaterialFormData) => {
    const formattedData: Omit<MaterialCatalog, 'id' | 'createdAt'> = {
      name: data.name.trim(),
      unit: data.unit,
      pricePerUnit: Number(data.pricePerUnit),
      density: data.density ? Number(data.density) : undefined,
      category: data.category?.trim() || undefined,
    };
    onSubmit(formattedData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {initialData ? 'Edytuj materiał' : 'Dodaj nowy materiał'}
      </Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Nazwa materiału *"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.name}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="unit"
        render={({ field: { value } }) => (
          <View style={styles.inputContainer}>
            <Menu
              visible={showUnitMenu}
              onDismiss={() => setShowUnitMenu(false)}
              anchor={
                <TextInput
                  label="Jednostka rozliczeniowa *"
                  mode="outlined"
                  value={value}
                  editable={false}
                  onPress={() => setShowUnitMenu(true)}
                  right={
                    <TextInput.Icon icon="menu-down" onPress={() => setShowUnitMenu(true)} />
                  }
                  style={styles.input}
                />
              }
            >
              {unitOptions.map((unit) => (
                <Menu.Item
                  key={unit}
                  title={unit}
                  onPress={() => {
                    setValue('unit', unit as any);
                    setShowUnitMenu(false);
                  }}
                />
              ))}
            </Menu>
            <HelperText type="error" visible={!!errors.unit}>
              {errors.unit?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="pricePerUnit"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Cena za jednostkę (zł) *"
              mode="outlined"
              value={value?.toString()}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              error={!!errors.pricePerUnit}
              style={styles.input}
              right={<TextInput.Affix text="zł" />}
            />
            <HelperText type="error" visible={!!errors.pricePerUnit}>
              {errors.pricePerUnit?.message}
            </HelperText>
          </View>
        )}
      />

      {isTonUnit && (
        <Controller
          control={control}
          name="density"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Gęstość (t/m³) - opcjonalnie"
                mode="outlined"
                value={value?.toString()}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                error={!!errors.density}
                style={styles.input}
              />
              <HelperText type="info" visible>
                Gęstość w tonach na metr sześcienny
              </HelperText>
            </View>
          )}
        />
      )}

      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Kategoria - opcjonalnie"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
            />
          </View>
        )}
      />

      <Divider style={styles.divider} />

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.button}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmitForm)}
          style={[styles.button, styles.submitButton]}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {initialData ? 'Zapisz zmiany' : 'Dodaj materiał'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#212121',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  submitButton: {
    backgroundColor: '#FF9800',
  },
});