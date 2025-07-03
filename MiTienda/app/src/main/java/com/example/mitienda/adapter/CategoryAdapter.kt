// mi-tienda-android/app/src/main/java/com/example/mitienda/adapter/CategoryAdapter.kt

package com.example.mitienda.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout // Asegúrate de que este import está ahí
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.example.mitienda.R
import com.example.mitienda.model.Category
import com.google.android.material.imageview.ShapeableImageView

class CategoryAdapter(
    private val categories: MutableList<Category>,
    private val onCategoryClick: (Category) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder>() {

    private var selectedPosition = RecyclerView.NO_POSITION

    inner class CategoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val categoryImage: ShapeableImageView = itemView.findViewById(R.id.category_image) // Usando ID: category_image
        val categoryName: TextView = itemView.findViewById(R.id.category_name) // Usando ID: category_name
        val categoryItemLayout: LinearLayout = itemView.findViewById(R.id.category_item_layout) // Usando ID: category_item_layout
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_category, parent, false)
        return CategoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        val category = categories[position]
        holder.categoryName.text = category.nombre

        holder.categoryImage.load(category.imageUrl) {
            crossfade(true)
            placeholder(R.drawable.placeholder_category)
            error(R.drawable.placeholder_category)
        }

        holder.categoryItemLayout.isSelected = (position == selectedPosition)
        holder.categoryName.setTextColor(
            holder.itemView.context.resources.getColor(
                if (position == selectedPosition) android.R.color.white else R.color.dark_text,
                null
            )
        )

        holder.itemView.setOnClickListener {
            val previousSelectedPosition = selectedPosition
            selectedPosition = holder.adapterPosition
            notifyItemChanged(previousSelectedPosition)
            notifyItemChanged(selectedPosition)
            onCategoryClick(category)
        }
    }

    override fun getItemCount(): Int {
        return categories.size
    }

    fun updateCategories(newCategories: List<Category>) {
        categories.clear()
        categories.addAll(newCategories)
        notifyDataSetChanged()
    }

    fun selectCategoryById(categoryId: Int) {
        val index = categories.indexOfFirst { it.id == categoryId }
        if (index != RecyclerView.NO_POSITION) {
            val previousSelectedPosition = selectedPosition
            selectedPosition = index
            notifyItemChanged(previousSelectedPosition)
            notifyItemChanged(selectedPosition)
        }
    }

    fun getSelectedCategory(): Category? {
        return if (selectedPosition != RecyclerView.NO_POSITION) {
            categories[selectedPosition]
        } else {
            null
        }
    }
}
