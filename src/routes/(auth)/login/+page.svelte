<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-gray-900">ProSync ERP</h1>
			<p class="mt-2 text-sm text-gray-600">
				ระบบบริหารจัดการยุทธศาสตร์และติดตามแผนพัฒนาองค์การ
			</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<label for="id_card" class="block text-sm font-medium text-gray-700">
						เลขบัตรประชาชน
					</label>
					<input
						type="text"
						id="id_card"
						name="id_card"
						maxlength="13"
						inputmode="numeric"
						placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						รหัสผ่าน
					</label>
					<input
						type="password"
						id="password"
						name="password"
						placeholder="กรอกรหัสผ่าน"
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						required
					/>
				</div>

				{#if form?.errors?.id_card}
					<p class="text-sm text-red-600">{form.errors.id_card[0]}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
				</button>
			</div>
		</form>
	</div>
</div>
