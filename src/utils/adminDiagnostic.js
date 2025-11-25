// Utilidad para diagnosticar permisos admin
import { supabase } from '../lib/supabase'

export async function checkAdminPermissions() {
  const results = {
    session: null,
    profile: null,
    canReadProducts: false,
    canInsertProduct: false,
    canUpdateProduct: false,
    canDeleteProduct: false,
    errors: []
  }

  try {
    // 1. Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      results.errors.push(`Session error: ${sessionError.message}`)
      return results
    }
    results.session = session?.user
      ? { id: session.user.id, email: session.user.email }
      : null

    if (!session?.user) {
      results.errors.push('No authenticated session')
      return results
    }

    // 2. Verificar perfil y rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, nombre, apellidos, requested_role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      results.errors.push(`Profile error: ${profileError.message}`)
    } else {
      results.profile = profile
    }

    // 3. Probar lectura de productos
    const { data: readData, error: readError } = await supabase
      .from('productos')
      .select('id')
      .limit(1)
    
    if (readError) {
      results.errors.push(`Read error: ${readError.message}`)
    } else {
      results.canReadProducts = true
    }

    // 4. Probar insert (con datos temporales)
    const testProduct = {
      nombre: '__TEST_ADMIN__',
      precio: 1.00,
      descripcion: 'Producto de prueba para verificar permisos admin',
      stock: 0
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('productos')
      .insert(testProduct)
      .select()
    
    if (insertError) {
      results.errors.push(`Insert error: ${insertError.message}`)
    } else {
      results.canInsertProduct = true
      
      // Si insertó, intentar update y delete
      if (insertData?.[0]?.id) {
        const testId = insertData[0].id
        
        // 5. Probar update
        const { error: updateError } = await supabase
          .from('productos')
          .update({ precio: 2.00 })
          .eq('id', testId)
        
        if (updateError) {
          results.errors.push(`Update error: ${updateError.message}`)
        } else {
          results.canUpdateProduct = true
        }

        // 6. Probar delete (limpiar producto de prueba)
        const { error: deleteError } = await supabase
          .from('productos')
          .delete()
          .eq('id', testId)
        
        if (deleteError) {
          results.errors.push(`Delete error: ${deleteError.message}`)
        } else {
          results.canDeleteProduct = true
        }
      }
    }

  } catch (err) {
    results.errors.push(`Unexpected error: ${err.message}`)
  }

  return results
}

export function printDiagnostic(results) {
  console.group('🔍 Admin Diagnostic')
  
  console.log('📧 Session:', results.session || 'Not authenticated')
  console.log('👤 Profile:', results.profile || 'Not found')
  
  console.log('\n✅ Permissions:')
  console.log('  Read products:', results.canReadProducts ? '✓' : '✗')
  console.log('  Insert product:', results.canInsertProduct ? '✓' : '✗')
  console.log('  Update product:', results.canUpdateProduct ? '✓' : '✗')
  console.log('  Delete product:', results.canDeleteProduct ? '✓' : '✗')
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:')
    results.errors.forEach(e => console.log('  -', e))
  }
  
  console.groupEnd()
  
  return results
}
