// mi-tienda-android/app/src/main/java/com/example/mitienda/ui/FiltersBottomSheetDialogFragment.kt

package com.example.mitienda.ui

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.activityViewModels // Importa para acceder al ViewModel de la actividad
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.example.mitienda.databinding.FragmentFiltersBottomSheetBinding
import com.example.mitienda.viewmodel.CatalogViewModel // Importa tu ViewModel
import com.google.android.material.slider.RangeSlider

/**
 * BottomSheetDialogFragment para mostrar y gestionar los filtros de productos (rango de precio).
 */
class FiltersBottomSheetDialogFragment : BottomSheetDialogFragment() {

    private var _binding: FragmentFiltersBottomSheetBinding? = null
    private val binding get() = _binding!!

    // Usar activityViewModels para obtener la misma instancia del ViewModel que la actividad
    private val catalogViewModel: CatalogViewModel by activityViewModels()

    // Callback para comunicar los filtros seleccionados a la actividad principal
    var onApplyFilters: ((minPrice: Double, maxPrice: Double) -> Unit)? = null
    // Callback para comunicar el restablecimiento de filtros
    var onResetFilters: (() -> Unit)? = null

    // Variables para mantener los valores actuales de los filtros
    private var initialMinPrice: Double = 0.0
    private var initialMaxPrice: Double = 2000.0 // Este valor será sobrescrito por el dinámico

    companion object {
        const val TAG = "FiltersBottomSheetDialogFragment"
        // No necesitamos pasar los precios iniciales directamente aquí,
        // ya que los obtendremos del ViewModel directamente en onViewCreated.
        fun newInstance(): FiltersBottomSheetDialogFragment {
            return FiltersBottomSheetDialogFragment()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFiltersBottomSheetBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Observar el dynamicMaxPrice del ViewModel para configurar el RangeSlider
        catalogViewModel.dynamicMaxPrice.observe(viewLifecycleOwner) { dynamicMax ->
            Log.d(TAG, "Observing dynamic max price: $dynamicMax")
            // Actualiza el initialMaxPrice con el valor dinámico observado.
            initialMaxPrice = dynamicMax

            // Configurar RangeSlider con el valor dinámico
            binding.priceRangeSlider.apply {
                valueFrom = 0f
                valueTo = initialMaxPrice.toFloat()

                // Asegurarse de que los valores iniciales de los sliders no excedan el nuevo 'valueTo'
                // y que reflejen los `currentMinPrice` y `currentMaxPrice` del ViewModel
                val minVal = catalogViewModel.currentMinPrice.toFloat().coerceIn(valueFrom, valueTo)
                val maxVal = catalogViewModel.currentMaxPrice.toFloat().coerceIn(valueFrom, valueTo)

                // Si el max actual del ViewModel es el "muy alto" (9999999.0),
                // significa que la categoría acaba de ser seleccionada o se limpiaron los filtros.
                // En ese caso, el slider debe mostrar el rango completo hasta el `dynamicMax`.
                if (catalogViewModel.currentMaxPrice == 9999999.0) {
                    setValues(valueFrom, valueTo)
                } else {
                    setValues(minVal, maxVal)
                }
            }

            // Actualizar los EditTexts para reflejar los valores iniciales o dinámicos.
            binding.minPriceInputFilter.setText(binding.priceRangeSlider.values[0].toInt().toString())
            binding.maxPriceInputFilter.setText(binding.priceRangeSlider.values[1].toInt().toString())
        }

        // Si ya hay un valor para dynamicMaxPrice, lo usamos para la configuración inicial
        catalogViewModel.dynamicMaxPrice.value?.let { dynamicMax ->
            initialMaxPrice = dynamicMax
            binding.priceRangeSlider.apply {
                valueFrom = 0f
                valueTo = initialMaxPrice.toFloat()
                val minVal = catalogViewModel.currentMinPrice.toFloat().coerceIn(valueFrom, valueTo)
                val maxVal = catalogViewModel.currentMaxPrice.toFloat().coerceIn(valueFrom, valueTo)

                if (catalogViewModel.currentMaxPrice == 9999999.0) {
                    setValues(valueFrom, valueTo)
                } else {
                    setValues(minVal, maxVal)
                }
            }
            binding.minPriceInputFilter.setText(binding.priceRangeSlider.values[0].toInt().toString())
            binding.maxPriceInputFilter.setText(binding.priceRangeSlider.values[1].toInt().toString())
        }


        // --- Listeners ---

        // RangeSlider Listener
        binding.priceRangeSlider.addOnChangeListener { slider, _, fromUser ->
            if (fromUser) {
                val values = slider.values
                binding.minPriceInputFilter.setText(values[0].toInt().toString())
                binding.maxPriceInputFilter.setText(values[1].toInt().toString())
            }
        }

        // EditTexts Listeners (sincronizar con RangeSlider)
        binding.minPriceInputFilter.addTextChangedListener(createPriceTextWatcher(binding.priceRangeSlider, true))
        binding.maxPriceInputFilter.addTextChangedListener(createPriceTextWatcher(binding.priceRangeSlider, false))

        // Botón Aplicar Filtros
        binding.applyFiltersBtn.setOnClickListener {
            // Obtener los valores finales de los EditTexts
            val min = binding.minPriceInputFilter.text.toString().toDoubleOrNull() ?: catalogViewModel.currentMinPrice
            val max = binding.maxPriceInputFilter.text.toString().toDoubleOrNull() ?: catalogViewModel.currentMaxPrice
            Log.d(TAG, "Apply Filters clicked: Min=$min, Max=$max")
            onApplyFilters?.invoke(min, max) // Llama al callback de aplicación
            dismiss() // Cierra el BottomSheet
        }

        // Botón Restablecer Filtros
        binding.resetFiltersBtn.setOnClickListener {
            Log.d(TAG, "Reset Filters clicked.")
            onResetFilters?.invoke() // Llama al callback de reinicio
            dismiss() // Cierra el BottomSheet
        }
    }

    /**
     * Crea un TextWatcher para sincronizar los EditTexts de precio con el RangeSlider.
     */
    private fun createPriceTextWatcher(slider: RangeSlider, isMin: Boolean): TextWatcher {
        return object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val value = s.toString().toDoubleOrNull()
                if (value != null) {
                    val currentValues = slider.values.toMutableList()
                    // Asegurar que el valor ingresado esté dentro del rango del slider [valueFrom, valueTo]
                    val clampedValue = value.toFloat().coerceIn(slider.valueFrom, slider.valueTo)

                    if (isMin) {
                        // El valor mínimo no puede ser mayor que el valor máximo actual del slider
                        currentValues[0] = clampedValue.coerceAtMost(currentValues[1])
                    } else {
                        // El valor máximo no puede ser menor que el valor mínimo actual del slider
                        currentValues[1] = clampedValue.coerceAtLeast(currentValues[0])
                    }
                    slider.setValues(currentValues[0], currentValues[1])
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null // Limpiar el binding para evitar fugas de memoria
    }
}
