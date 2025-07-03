// mi-tienda-android/app/src/main/java/com/example/mitienda/adapter/ProductAdapter.kt

package com.example.mitienda.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import coil.load // Importación para Coil
import com.example.mitienda.R
import com.example.mitienda.model.Product
import java.text.NumberFormat
import java.util.* // Para NumberFormat y Locale

/**
 * Adaptador para el RecyclerView que muestra los productos en una cuadrícula.
 */
class ProductAdapter(
    private val products: MutableList<Product>, // Usar MutableList para poder modificar la lista
    private val categoryNamesMap: Map<Int, String> // Mapa de ID de categoría a Nombre de categoría
) : RecyclerView.Adapter<ProductAdapter.ProductViewHolder>() {

    /**
     * ViewHolder que contiene la vista de cada ítem de producto.
     */
    inner class ProductViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val productImage: ImageView = itemView.findViewById(R.id.product_image)
        val productName: TextView = itemView.findViewById(R.id.product_name)
        val productCategory: TextView = itemView.findViewById(R.id.product_category)
        val productPrice: TextView = itemView.findViewById(R.id.product_price)
        // Puedes añadir botones de Comprar/Añadir al carrito si los implementas
        // val buyButton: MaterialButton = itemView.findViewById(R.id.buy_button)
        // val addToCartButton: MaterialButton = itemView.findViewById(R.id.add_to_cart_button)
    }

    /**
     * Crea y devuelve un ViewHolder para la vista de un ítem de producto.
     */
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProductViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_product, parent, false)
        return ProductViewHolder(view)
    }

    /**
     * Vincula los datos de un producto a un ViewHolder.
     */
    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        val product = products[position]
        holder.productName.text = product.nombre

        // Obtener el nombre de la categoría usando el mapa
        val categoryName = categoryNamesMap[product.categoryId] ?: "Categoría Desconocida"
        holder.productCategory.text = categoryName

        // Formatear el precio a moneda local (ej. $99.99)
        val format = NumberFormat.getCurrencyInstance(Locale.US) // O Locale("es", "ES") para Euro
        holder.productPrice.text = format.format(product.precio)

        // Carga la imagen usando Coil
        holder.productImage.load(product.imageUrl) {
            crossfade(true)
            placeholder(R.drawable.placeholder_product) // Imagen de placeholder mientras carga
            error(R.drawable.placeholder_product) // Imagen si hay error al cargar
        }

        // Aquí podrías añadir listeners para los botones de comprar/añadir al carrito si existieran
        // holder.buyButton.setOnClickListener { /* Lógica de comprar */ }
        // holder.addToCartButton.setOnClickListener { /* Lógica de añadir al carrito */ }
    }

    /**
     * Devuelve el número total de ítems en la lista de productos.
     */
    override fun getItemCount(): Int {
        return products.size
    }

    /**
     * Actualiza la lista de productos en el adaptador y notifica los cambios.
     */
    fun updateProducts(newProducts: List<Product>) {
        products.clear()
        products.addAll(newProducts)
        notifyDataSetChanged() // Notifica un cambio completo en los datos
    }

    /**
     * Añade más productos a la lista existente.
     */
    fun addProducts(newProducts: List<Product>) {
        val startPosition = products.size
        products.addAll(newProducts)
        notifyItemRangeInserted(startPosition, newProducts.size)
    }

    /**
     * Borra todos los productos del adaptador.
     */
    fun clearProducts() {
        products.clear()
        notifyDataSetChanged()
    }
}
